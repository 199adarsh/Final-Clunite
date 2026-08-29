'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getUserFromDatabase } from '@/lib/sync-user';
import { getUserAvatarUrl } from '@/lib/avatar-utils';
import { supabase } from '@/lib/supabase';
import { normalizeCollegeName, formatBranchName, getTier } from '@/app/dashboard/student/rank/page';
import { cn } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Calendar,
  Award,
  Users,
  QrCode,
  Clock,
  MapPin,
  Sparkles,
  Loader2,
  Building2,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Ticket,
  ChevronRight,
  ExternalLink,
  Zap,
  GraduationCap,
  Flame,
  Check
} from 'lucide-react';

const avatarColors = [
  'bg-indigo-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-blue-600',
  'bg-amber-600',
  'bg-rose-600',
];

/* ---------------- RECOMMENDATION ENGINE HELPER ---------------- */
interface RecommendedEventItem {
  event: any;
  matchScore: number;
  matchReason: string;
  isLive: boolean;
}

function computeEventRecommendations(
  events: any[],
  userCollege: string,
  userBranch: string,
  joinedClubIds: Set<string>,
  registeredEventIds: Set<string>
): RecommendedEventItem[] {
  const now = new Date();
  const collegeLower = (userCollege || '').toLowerCase().trim();
  const branchLower = (userBranch || '').toLowerCase().trim();

  return (events || [])
    .filter((e) => {
      // 1. Must be published & not already registered
      if (e.status !== 'published') return false;
      if (registeredEventIds.has(e.id)) return false;

      // 2. Must be CURRENTLY LIVE / NOT EXPIRED
      if (e.registration_deadline) {
        const deadline = new Date(e.registration_deadline);
        if (deadline < now) return false;
      } else if (e.end_date) {
        const endDate = new Date(e.end_date);
        if (endDate < now) return false;
      } else if (e.start_date) {
        const startDate = new Date(e.start_date);
        if (startDate < now) return false;
      }

      return true;
    })
    .map((e) => {
      let score = 50; // Base score
      let matchReason = 'Trending Campus Event';

      const eventCol = (e.college || e.club?.college || '').toLowerCase();
      const eventTitle = (e.title || '').toLowerCase();
      const eventDesc = (e.description || '').toLowerCase();
      const eventText = `${eventTitle} ${eventDesc}`;

      const isSameCampus = collegeLower && (eventCol.includes(collegeLower) || collegeLower.includes(eventCol));
      const isJoinedClub = e.club_id && joinedClubIds.has(e.club_id);

      // Branch match
      let isBranchMatch = false;
      if (branchLower) {
        const keywords = branchLower.split(' ').filter((w) => w.length > 2);
        isBranchMatch = keywords.some((kw) => eventText.includes(kw));
        if (branchLower.includes('ai') || branchLower.includes('data') || branchLower.includes('cs') || branchLower.includes('tech')) {
          if (eventText.includes('hackathon') || eventText.includes('code') || eventText.includes('ai') || eventText.includes('data') || eventText.includes('web') || eventText.includes('tech')) {
            isBranchMatch = true;
          }
        }
      }

      if (isSameCampus && isBranchMatch) {
        score = 98;
        matchReason = `Direct Match for ${formatBranchName(userBranch)} at ${normalizeCollegeName(userCollege) || 'Campus'}`;
      } else if (isJoinedClub) {
        score = 95;
        matchReason = `Hosted by your joined club (${e.club?.name || 'Club'})`;
      } else if (isBranchMatch) {
        score = 91;
        matchReason = `Recommended for ${formatBranchName(userBranch)} students`;
      } else if (isSameCampus) {
        score = 86;
        matchReason = `Campus Spotlight at ${normalizeCollegeName(userCollege) || 'Campus'}`;
      } else if (e.prize_pool && Number(e.prize_pool) > 0) {
        score = 80;
        matchReason = `High Prize Pool (₹${Number(e.prize_pool).toLocaleString()})`;
      }

      return {
        event: e,
        matchScore: score,
        matchReason,
        isLive: true,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    registeredEvents: 0,
    attendedEvents: 0,
    certificates: 0,
    joinedClubs: 0,
    totalXp: 0,
  });

  // Data lists
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [recommendedList, setRecommendedList] = useState<RecommendedEventItem[]>([]);
  const [userClubsList, setUserClubsList] = useState<any[]>([]);
  const [recentCerts, setRecentCerts] = useState<any[]>([]);
  const [eventAttendees, setEventAttendees] = useState<Record<string, { users: Array<{ id: string; name: string; initials: string }>; totalCount: number }>>({});

  // Active Feed View: 'registrations' | 'recommended'
  const [feedTab, setFeedTab] = useState<'recommended' | 'registrations'>('recommended');

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      router.push('/login');
      return;
    }

    // Safety: show dashboard after 12s no matter what (handles hanging queries on Render)
    const safetyTimer = setTimeout(() => {
      console.warn('Dashboard fetch timeout — forcing render with available data');
      setLoading(false);
    }, 12000);

    // Helper: race any promise against a per-query timeout
    function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Query timed out after ${ms}ms`)), ms)
        ),
      ]);
    }

    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Set name immediately from auth metadata so banner shows fast
        if (authUser?.user_metadata?.full_name) {
          setUserData({
            full_name: authUser.user_metadata.full_name,
            college: authUser.user_metadata.college || '',
            branch: authUser.user_metadata.branch || '',
          });
        }

        // Fetch user profile
        let dbUser: any = null;
        try {
          dbUser = await withTimeout(getUserFromDatabase(authUser!.id));
          if (dbUser) setUserData(dbUser);
        } catch (e) {
          console.warn('User profile fetch timed out, using auth metadata');
        }

        // Fetch all dashboard data — each query races against 8s timeout
        const [regsResult, membershipsResult, publishedEventsResult, attendeesResult] =
          await Promise.allSettled([
            withTimeout(
              supabase
                .from('event_registrations')
                .select(`
                  id,
                  status,
                  registered_at,
                  event:events(
                    id,
                    title,
                    description,
                    start_date,
                    end_date,
                    registration_deadline,
                    venue,
                    location,
                    mode,
                    entry_fee,
                    prize_pool,
                    image_url,
                    status,
                    college,
                    contact_info,
                    club:clubs(id, name, logo_url)
                  )
                `)
                .eq('user_id', authUser!.id)
                .order('registered_at', { ascending: false })
                .then((r) => r.data || [])
            ),
            withTimeout(
              supabase
                .from('club_memberships')
                .select(`id, role, club:clubs(id, name, logo_url, category, college)`)
                .eq('user_id', authUser!.id)
                .then((r) => r.data || [])
            ),
            withTimeout(
              supabase
                .from('events')
                .select(`*, club:clubs(*)`)
                .eq('status', 'published')
                .order('start_date', { ascending: true })
                .then((r) => r.data || [])
            ),
            withTimeout(
              supabase
                .from('event_registrations')
                .select(`id, event_id, user_id, status, user:users(id, full_name, college, branch)`)
                .in('status', ['registered', 'attended'])
                .limit(300)
                .then((r) => r.data || [])
            ),
          ]);

        const regs = regsResult.status === 'fulfilled' ? regsResult.value as any[] : [];
        const memberships = membershipsResult.status === 'fulfilled' ? membershipsResult.value as any[] : [];
        const publishedEvents = publishedEventsResult.status === 'fulfilled' ? publishedEventsResult.value as any[] : [];
        const recentAttendeesData = attendeesResult.status === 'fulfilled' ? attendeesResult.value as any[] : [];

        if (regsResult.status === 'rejected') console.warn('Registrations query failed:', regsResult.reason);
        if (membershipsResult.status === 'rejected') console.warn('Memberships query failed:', membershipsResult.reason);
        if (publishedEventsResult.status === 'rejected') console.warn('Events query failed:', publishedEventsResult.reason);
        if (attendeesResult.status === 'rejected') console.warn('Attendees query failed:', attendeesResult.reason);

        // Fetch certificates via server API route (server-side Supabase, no browser RLS issues)
        let explicitCerts: any[] = [];
        try {
          const certsRes = await withTimeout(
            fetch(`/api/certificates?userId=${authUser!.id}&email=${encodeURIComponent(authUser!.email || '')}`)
              .then((r) => r.json())
              .then((j) => j.data || []),
            20000 // 20s timeout — server-side calls can be slow on Render cold start
          );
          explicitCerts = certsRes || [];
        } catch (certErr) {
          console.warn('Could not load certificates via API (non-fatal):', certErr);
        }

        // Also check localStorage as a fallback (for certs issued on the same device)
        try {
          const localRaw = localStorage.getItem('clunite_issued_certificates');
          if (localRaw) {
            const localList = JSON.parse(localRaw);
            const currentEmail = authUser?.email?.toLowerCase();
            const currentUserId = authUser?.id;
            localList.forEach((c: any) => {
              const matchesEmail = c.recipient_email && c.recipient_email.toLowerCase() === currentEmail;
              const matchesUser = c.user_id && c.user_id === currentUserId;
              if ((matchesEmail || matchesUser) && !explicitCerts.some((ec) => ec.id === c.id || ec.certificate_code === c.certificate_code)) {
                explicitCerts.push(c);
              }
            });
          }
        } catch (e) {
          console.warn('Local cert sync warning:', e);
        }

        // Process Registrations
        const validRegs = (regs || []).filter((r) => r.event);
        setUserRegistrations(validRegs);

        const registeredEventsCount = validRegs.filter((r) => r.status !== 'cancelled').length;
        const attendedEventsCount = validRegs.filter((r) => r.status === 'attended').length;

        // Process Memberships
        const validClubs = (memberships || []).map((m: any) => m.club).filter(Boolean);
        setUserClubsList(validClubs);
        const joinedClubsCount = validClubs.length;
        const joinedClubIds = new Set(validClubs.map((c: any) => c.id));

        // Process Attendee Avatars
        const attendeesMap: Record<string, { users: Array<{ id: string; name: string; initials: string }>; totalCount: number }> = {};
        (recentAttendeesData || []).forEach((reg: any) => {
          const eId = reg.event_id;
          if (!eId) return;
          if (!attendeesMap[eId]) {
            attendeesMap[eId] = { users: [], totalCount: 0 };
          }
          attendeesMap[eId].totalCount += 1;
          const fullName = reg.user?.full_name;
          if (fullName && attendeesMap[eId].users.length < 4) {
            if (!attendeesMap[eId].users.some((u) => u.id === reg.user_id)) {
              const initials = fullName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'ST';
              attendeesMap[eId].users.push({
                id: reg.user_id,
                name: fullName,
                initials,
              });
            }
          }
        });
        setEventAttendees(attendeesMap);

        // Process Certificates — explicitCerts already includes Supabase + localStorage
        const certCodes = new Set<string>();
        validRegs.forEach((r) => {
          if (r.status === 'attended' && (r.event as any)?.contact_info?.certificates_enabled) {
            certCodes.add(r.id);
          }
        });
        explicitCerts.forEach((c: any) => certCodes.add(c.certificate_code || c.id));

        const certificatesCount = certCodes.size;
        setRecentCerts(explicitCerts.slice(0, 3));

        // Compute Live XP
        const totalXp =
          registeredEventsCount * 10 +
          attendedEventsCount * 30 +
          certificatesCount * 50 +
          joinedClubsCount * 15;

        setStats({
          registeredEvents: registeredEventsCount,
          attendedEvents: attendedEventsCount,
          certificates: certificatesCount,
          joinedClubs: joinedClubsCount,
          totalXp,
        });

        // Run Recommendation Engine (Live Events Only)
        const registeredEventIds = new Set(validRegs.map((r) => (r.event as any)?.id));
        const computedRecommendations = computeEventRecommendations(
          publishedEvents || [],
          dbUser?.college || authUser?.user_metadata?.college || '',
          dbUser?.branch || authUser?.user_metadata?.branch || '',
          joinedClubIds,
          registeredEventIds
        );

        setRecommendedList(computedRecommendations);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    }

    fetchDashboardData();

    return () => clearTimeout(safetyTimer);
  }, [authUser, authLoading, router]);

  // Find nearest upcoming registered event for the active pass
  const nextUpcomingEvent = useMemo(() => {
    const now = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const upcoming = userRegistrations
      .filter((r) => r.status !== 'cancelled' && new Date(r.event.start_date) >= now)
      .sort((a, b) => new Date(a.event.start_date).getTime() - new Date(b.event.start_date).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [userRegistrations]);

  const userTier = getTier(stats.totalXp);
  const normalizedCollege = normalizeCollegeName(userData?.college) || userData?.college || 'Campus';
  const displayBranch = formatBranchName(userData?.branch);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6 sm:space-y-8 antialiased">
      {/* ================= HERO & IDENTITY ================= */}
      <div className="relative rounded-2xl bg-white border border-black/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/60 via-purple-100/30 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Student Portal</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold truncate">{normalizedCollege}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {userData?.full_name?.split(' ')[0] || 'Student'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {displayBranch} • Real-time event schedule, recommendations, and verified credentials.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Link href="/dashboard/student/rank">
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold text-xs hover:bg-indigo-100 cursor-pointer transition-colors flex items-center gap-1">
                <Zap className="h-3 w-3 text-indigo-600 fill-indigo-600" />
                <span>{stats.totalXp} XP • {userTier.name}</span>
              </Badge>
            </Link>

            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs">
              <Calendar className="h-3 w-3 mr-1 text-slate-500" />
              {stats.registeredEvents} Registered
            </Badge>

            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
              <Award className="h-3 w-3 mr-1 text-emerald-600" />
              {stats.certificates} Credentials
            </Badge>
          </div>
        </div>

        {/* Character Illustration */}
        <div className="hidden lg:block relative z-10 shrink-0">
          <img
            src={userData?.gender?.toLowerCase() === 'female' ? '/girl.png' : '/boy.png'}
            alt="Student Avatar"
            className="h-40 w-auto object-contain drop-shadow-sm select-none pointer-events-none"
          />
        </div>
      </div>

      {/* ================= ACTIVE EVENT PASS (IF REGISTERED) ================= */}
      {nextUpcomingEvent && (
        <Card className="border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Ticket className="h-6 w-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5">
                    UPCOMING ENTRY PASS
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">
                    {new Date(nextUpcomingEvent.event.start_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                  {nextUpcomingEvent.event.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{nextUpcomingEvent.event.venue || nextUpcomingEvent.event.location || 'Campus Venue'}</span>
                  <span>•</span>
                  <span>{nextUpcomingEvent.event.club?.name || 'Club'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
              <Link href="/dashboard/student/qr">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-9 shadow-sm flex items-center gap-1.5">
                  <QrCode className="h-4 w-4" />
                  <span>Open Check-in Pass</span>
                </Button>
              </Link>
              <Link href={`/dashboard/student/events/${nextUpcomingEvent.event.id}`}>
                <Button variant="outline" className="rounded-xl border-slate-200 text-xs font-semibold h-9">
                  Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= PRACTICAL STATS GRID ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Registered Events</p>
              <p className="text-2xl font-black text-slate-900">{stats.registeredEvents}</p>
              <span className="text-[11px] text-indigo-600 font-medium">Active Schedule</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Attended Check-ins</p>
              <p className="text-2xl font-black text-slate-900">{stats.attendedEvents}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Verified Presence</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Digital Credentials</p>
              <p className="text-2xl font-black text-slate-900">{stats.certificates}</p>
              <span className="text-[11px] text-amber-600 font-medium">Verified Certificates</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Club Memberships</p>
              <p className="text-2xl font-black text-slate-900">{stats.joinedClubs}</p>
              <span className="text-[11px] text-purple-600 font-medium">Joined Societies</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* LEFT COLUMN (2/3 width) - LIVE EVENT SCHEDULE & RECOMMENDATION ENGINE */}
        <div className="lg:col-span-2 space-y-4">
          {/* Feed Switcher Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
            <div className="flex items-center bg-slate-100/90 rounded-xl p-1 border border-slate-200/70 shadow-xs">
              <button
                onClick={() => setFeedTab('recommended')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  feedTab === 'recommended'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Recommended For You</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  feedTab === 'recommended' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {recommendedList.length}
                </span>
              </button>
              
              <button
                onClick={() => setFeedTab('registrations')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  feedTab === 'registrations'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>My Schedule</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                  feedTab === 'registrations' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {userRegistrations.length}
                </span>
              </button>
            </div>

            <Link href="/dashboard/student/browse">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/70 rounded-lg">
                <span>Browse All</span>
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </div>

          {/* TAB 1: RECOMMENDATIONS */}
          {feedTab === 'recommended' && (
            <div className="space-y-3.5">
              {recommendedList.length === 0 ? (
                <Card className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No Live Events Currently Open</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    All current events for your campus have closed registration or passed. Check back soon for newly published hackathons and workshops.
                  </p>
                  <Link href="/dashboard/student/browse">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">
                      Browse Full Event Directory
                    </Button>
                  </Link>
                </Card>
              ) : (
                recommendedList.map(({ event, matchScore, matchReason }) => {
                  const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const attendees = eventAttendees[event.id] || { users: [], totalCount: 0 };

                  return (
                    <Card
                      key={event.id}
                      className="border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200/90 rounded-2xl bg-white transition-all duration-200 overflow-hidden group"
                    >
                      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          {/* Badges Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                              {matchScore}% Match
                            </span>

                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-semibold capitalize">
                              {event.mode || 'offline'}
                            </Badge>

                            {event.entry_fee === 0 ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                Free
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                ₹{event.entry_fee}
                              </span>
                            )}

                            {event.club?.name && (
                              <span className="text-[11px] text-slate-500 font-medium truncate">
                                • {event.club.name}
                              </span>
                            )}
                          </div>

                          {/* Event Title */}
                          <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                            {event.title}
                          </h3>

                          {/* Reason */}
                          <p className="text-xs text-indigo-600 font-semibold truncate">
                            {matchReason}
                          </p>

                          {/* Date & Location */}
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {eventDate}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {event.venue || event.location || 'Campus Auditorium'}
                            </span>
                          </div>

                          {/* Attendees Stack (Logos / Avatars of recently registered students) */}
                          <div className="pt-1 flex items-center gap-2">
                            {attendees.users.length > 0 ? (
                              <>
                                <div className="flex -space-x-1 overflow-hidden shrink-0">
                                  {attendees.users.map((student, idx) => (
                                    <div
                                      key={student.id || idx}
                                      title={student.name}
                                      className={cn(
                                        "inline-flex h-6 w-6 rounded-full ring-2 ring-white items-center justify-center text-[9px] font-bold text-white shadow-xs select-none shrink-0",
                                        avatarColors[idx % avatarColors.length]
                                      )}
                                    >
                                      {student.initials}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {attendees.totalCount > attendees.users.length
                                    ? `+${attendees.totalCount} students registered`
                                    : `${attendees.totalCount} ${attendees.totalCount === 1 ? 'student' : 'students'} registered`}
                                </span>
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                <span>Be the first to register</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0 w-full sm:w-auto text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <Link href={`/dashboard/student/events/${event.id}`}>
                            <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-sm hover:shadow transition-all">
                              Register Now
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: MY SCHEDULE / REGISTERED */}
          {feedTab === 'registrations' && (
            <div className="space-y-3.5">
              {userRegistrations.length === 0 ? (
                <Card className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No Active Registrations</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not registered for any events yet. Check the "Recommended For You" tab to register.
                  </p>
                  <Button
                    onClick={() => setFeedTab('recommended')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                  >
                    View Recommended Events
                  </Button>
                </Card>
              ) : (
                userRegistrations.map((reg) => {
                  const event = reg.event;
                  const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const isAttended = reg.status === 'attended';
                  const attendees = eventAttendees[event.id] || { users: [], totalCount: 0 };

                  return (
                    <Card
                      key={reg.id}
                      className="border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200/90 rounded-2xl bg-white transition-all duration-200 overflow-hidden group"
                    >
                      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={`text-[10px] font-bold ${
                                isAttended
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isAttended ? 'Attended & Verified' : 'Registered'}
                            </Badge>
                            <span className="text-[11px] text-slate-500 font-semibold capitalize">
                              {event.mode || 'offline'}
                            </span>
                            {event.club?.name && (
                              <span className="text-[11px] text-slate-500 font-medium">• {event.club.name}</span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                            {event.title}
                          </h3>

                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {eventDate}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {event.venue || event.location || 'Campus Auditorium'}
                            </span>
                          </div>

                          {/* Attendees Stack */}
                          <div className="pt-1 flex items-center gap-2">
                            {attendees.users.length > 0 ? (
                              <>
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {attendees.users.map((student, idx) => (
                                    <div
                                      key={student.id || idx}
                                      title={student.name}
                                      className={cn(
                                        "inline-flex h-6 w-6 rounded-full ring-2 ring-white items-center justify-center text-[9px] font-bold text-white shadow-xs select-none",
                                        avatarColors[idx % avatarColors.length]
                                      )}
                                    >
                                      {student.initials}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {attendees.totalCount} participants registered
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <Link href="/dashboard/student/qr">
                            <Button size="sm" variant="outline" className="rounded-xl border-slate-200 text-xs font-semibold h-9 px-3 hover:bg-slate-50">
                              <QrCode className="h-3.5 w-3.5 mr-1 text-slate-600" /> QR Pass
                            </Button>
                          </Link>
                          <Link href={`/dashboard/student/events/${event.id}`}>
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-9 px-4">
                              View Event
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (1/3 width) - PRACTICAL UTILITIES */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <Card className="border border-black/5 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Quick Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link href="/dashboard/student/qr" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl border-slate-200 text-xs font-semibold h-10 hover:bg-indigo-50/50 hover:text-indigo-700"
                >
                  <span className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-indigo-600" />
                    Scan Event Check-in Pass
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>

              <Link href="/dashboard/student/certificates" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl border-slate-200 text-xs font-semibold h-10 hover:bg-emerald-50/50 hover:text-emerald-700"
                >
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    Digital Credentials ({stats.certificates})
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>

              <Link href="/dashboard/student/my-clubs" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl border-slate-200 text-xs font-semibold h-10 hover:bg-purple-50/50 hover:text-purple-700"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    My Clubs & Societies ({stats.joinedClubs})
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>

              <Link href="/dashboard/student/rank" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl border-slate-200 text-xs font-semibold h-10 hover:bg-amber-50/50 hover:text-amber-700"
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    Campus Leaderboard
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Joined Clubs Snapshot */}
          <Card className="border border-black/5 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Your Clubs
              </CardTitle>
              <Link href="/dashboard/student/my-clubs" className="text-xs text-indigo-600 hover:underline font-semibold">
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {userClubsList.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-500">You haven't joined any campus clubs.</p>
                  <Link href="/dashboard/student/my-clubs">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                      Explore Clubs
                    </Button>
                  </Link>
                </div>
              ) : (
                userClubsList.slice(0, 3).map((club: any) => (
                  <Link key={club.id} href={`/dashboard/student/my-clubs/${club.id}`} className="block">
                    <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {club.logo_url ? (
                          <img src={club.logo_url} alt={club.name} className="w-8 h-8 rounded-lg object-cover bg-white shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {club.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-xs text-slate-900 truncate">{club.name}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Credentials Snapshot */}
          {recentCerts.length > 0 && (
            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" />
                  Recent Credentials
                </CardTitle>
                <Link href="/dashboard/student/certificates" className="text-xs text-emerald-700 hover:underline font-semibold">
                  All ({stats.certificates})
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {recentCerts.map((cert) => (
                  <div key={cert.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">Certificate of Completion</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{cert.certificate_code}</p>
                    </div>
                    <Link href="/dashboard/student/certificates">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] font-semibold text-emerald-700">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
