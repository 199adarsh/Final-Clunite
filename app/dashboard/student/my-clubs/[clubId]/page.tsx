'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Calendar,
  Star,
  MapPin,
  Clock,
  Trophy,
  ExternalLink,
  Plus,
  Share2,
  ShieldCheck,
  Check,
  Building2,
  Mail,
  User,
  GraduationCap,
  Sparkles,
  Layers,
  FileText,
  MessageSquare,
  Globe,
  Github,
  Linkedin,
  Instagram,
  X,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useClub, joinClubInstant, leaveClubInstant } from '@/hooks/useClubs';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatBranchName } from '@/app/dashboard/student/rank/page';

interface ClubMemberItem {
  id: string;
  role: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    branch: string | null;
    gender: string | null;
  };
}

export default function ClubProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;
  const { user: authUser } = useAuth();
  const userId = authUser?.id;

  const { club, events, loading, error, refetch } = useClub(clubId);
  const [activeTab, setActiveTab] = useState('overview');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [membersList, setMembersList] = useState<ClubMemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check if current logged-in user is a member
  useEffect(() => {
    async function checkMembershipAndLoadMembers() {
      if (!clubId) return;
      try {
        setMembersLoading(true);

        // 1. Check user membership
        if (userId) {
          const { data: memberCheck } = await supabase
            .from('club_memberships')
            .select('id')
            .eq('club_id', clubId)
            .eq('user_id', userId)
            .maybeSingle();
          setIsMember(!!memberCheck);
        }

        // 2. Fetch all members of this club
        const { data: memberData } = await supabase
          .from('club_memberships')
          .select(`
            id,
            role,
            user:users (id, full_name, email, avatar_url, branch, gender)
          `)
          .eq('club_id', clubId);

        if (memberData) {
          const validMembers = (memberData as any[])
            .filter((m) => m.user)
            .map((m) => ({
              id: m.id,
              role: m.role || 'Member',
              user: m.user,
            }));
          setMembersList(validMembers);
        }
      } catch (err) {
        console.error('Error fetching club membership data:', err);
      } finally {
        setMembersLoading(false);
      }
    }

    checkMembershipAndLoadMembers();
  }, [clubId, userId]);

  const handleJoin = async () => {
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      setJoining(true);
      await joinClubInstant(userId, clubId);
      setIsMember(true);
      await refetch();
      toast.success(`Joined ${club?.name || 'club'}!`);
    } catch (err) {
      console.error('Error joining club:', err);
      toast.error('Failed to join club.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!userId) return;

    try {
      setLeaving(true);
      await leaveClubInstant(userId, clubId);
      setIsMember(false);
      await refetch();
      setLeaveModalOpen(false);
      toast.info(`Left ${club?.name || 'club'}.`);
    } catch (err) {
      console.error('Error leaving club:', err);
      toast.error('Failed to leave club.');
    } finally {
      setLeaving(false);
    }
  };

  const handleCopyShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success('Club link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = (events || []).filter((e) => new Date(e.start_date) > now || e.status === 'published');
  const pastEvents = (events || []).filter((e) => new Date(e.start_date) <= now && e.status !== 'published');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-16 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-black/5 text-center space-y-3 max-w-md shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900">Club Not Found</h2>
          <p className="text-xs text-slate-500">
            The club you are looking for might have been moved or removed.
          </p>
          <Button onClick={() => router.push('/dashboard/student/my-clubs')} className="rounded-xl text-xs">
            Back to My Clubs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6 sm:space-y-8 antialiased">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/student/my-clubs">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to My Clubs
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyShare}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 mr-1" /> : <Share2 className="h-3.5 w-3.5 mr-1" />}
            {copiedLink ? 'Copied' : 'Share Club'}
          </Button>
        </div>
      </div>

      {/* ================= HERO CLUB BANNER ================= */}
      <div className="relative rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden">
        {/* Cover Background */}
        <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-indigo-200/70 via-purple-100/50 to-slate-100 relative overflow-hidden">
          {club.banner_url && (
            <img
              src={club.banner_url}
              alt={club.name}
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 sm:-mt-16 mb-4">
            {/* Avatar & Title */}
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                {club.logo_url ? (
                  <img
                    src={club.logo_url}
                    alt={club.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-md bg-white"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-3xl sm:text-4xl flex items-center justify-center border-4 border-white shadow-md">
                    {club.name.charAt(0)}
                  </div>
                )}
                {club.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-lg p-1 shadow-sm">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {club.name}
                  </h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-semibold capitalize">
                    {club.category}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{club.college}</span>
                </p>
              </div>
            </div>

            {/* Membership Action Button */}
            <div className="flex items-center gap-2 shrink-0">
              {isMember ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-none">
                    <Check className="h-3.5 w-3.5" />
                    <span>Active Member</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeaveModalOpen(true)}
                    className="rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50"
                  >
                    Leave
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={joining}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs px-5 h-9 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {joining ? 'Joining...' : 'Join Club'}
                </Button>
              )}
            </div>
          </div>

          {/* Tagline / Description */}
          {club.tagline && (
            <p className="text-sm font-semibold text-slate-700 mt-2">{club.tagline}</p>
          )}
        </div>
      </div>

      {/* ================= STATS ROW ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Members</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{club.members_count || membersList.length || 1}</p>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Events Hosted</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{events.length || club.events_hosted_count || 0}</p>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Credibility Score</span>
            <p className="text-xl font-extrabold text-indigo-700 mt-0.5">
              {club.credibility_score ? Number(club.credibility_score).toFixed(1) : '9.4'}/10
            </p>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Category</span>
            <p className="text-base font-bold text-slate-800 mt-0.5 capitalize truncate">
              {club.category || 'Technical'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================= TABS SECTION ================= */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-black/5 p-1 rounded-2xl h-auto shadow-sm">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
          >
            Overview & Notices
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-1.5"
          >
            <span>Events</span>
            <Badge className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0 h-4 border-0">
              {events.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-1.5"
          >
            <span>Team & Members</span>
            <Badge className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0 h-4 border-0">
              {membersList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="resources"
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
          >
            Community & Links
          </TabsTrigger>
        </TabsList>

        {/* =========================================================================
            TAB 1: OVERVIEW & NOTICES
           ========================================================================= */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: About & Vision */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    About the Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    {club.description ||
                      `${club.name} is a premier student organization on campus dedicated to fostering collaboration, hands-on learning, and practical problem solving.`}
                  </p>
                  {club.vision && (
                    <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                      <span className="text-[11px] font-bold uppercase text-indigo-700">Vision & Mission</span>
                      <p className="text-xs text-indigo-900 font-medium">{club.vision}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pinned Notices / Announcements */}
              <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Club Notice Board & Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Official Orientation & Welcome Meeting</span>
                      <span className="text-[10px] text-slate-400">Recently Pinned</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Welcome all newly joined members! Join our official Discord and WhatsApp groups in the "Community & Links" tab for weekly sync schedules and internal project allocations.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Upcoming Hackathons & Workshop Series</span>
                      <span className="text-[10px] text-slate-400">Notice</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Check out the "Events" tab to register early for our upcoming campus workshop sessions and earn Clunite verified certificates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Leadership & Info */}
            <div className="space-y-6">
              <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Leadership & Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3.5 text-xs">
                  {club.faculty_in_charge && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Faculty In-Charge</span>
                      <p className="font-bold text-slate-900">{club.faculty_in_charge}</p>
                    </div>
                  )}

                  {club.contact_email && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Official Email</span>
                      <p className="font-semibold text-indigo-600 truncate">{club.contact_email}</p>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Affiliation</span>
                    <p className="font-semibold text-slate-800">{club.college}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* =========================================================================
            TAB 2: EVENTS & SCHEDULE
           ========================================================================= */}
        <TabsContent value="events" className="space-y-6">
          {events.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center space-y-3 shadow-sm">
              <Calendar className="h-8 w-8 text-indigo-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Events Scheduled</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This club currently does not have active published events. Check back soon for new hackathons and workshops.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="border border-black/5 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold capitalize">
                        {event.mode || 'offline'}
                      </Badge>
                      {event.entry_fee === 0 ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Free Entry
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          ₹{event.entry_fee}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {event.description || 'Join this exciting campus event hosted by the club.'}
                    </p>

                    <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{event.current_participants || 0} registered</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/dashboard/student/events/${event.id}`}
                      className="w-full"
                    >
                      <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">
                        View Event Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 3: TEAM & MEMBERS DIRECTORY
           ========================================================================= */}
        <TabsContent value="team" className="space-y-6">
          {membersLoading ? (
            <div className="flex h-48 items-center justify-center bg-white rounded-2xl border border-black/5">
              <Skeleton className="h-6 w-32" />
            </div>
          ) : membersList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center space-y-3 shadow-sm">
              <Users className="h-8 w-8 text-indigo-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Members Listed</h3>
              <p className="text-xs text-slate-500">Be the first to join this organization!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Member Profile</span>
                <span className="hidden sm:inline">Branch</span>
                <span>Role</span>
              </div>

              <div className="space-y-2">
                {membersList.map((m) => {
                  let avatarUrl = m.user.avatar_url;
                  if (!avatarUrl) {
                    avatarUrl = m.user.gender?.toLowerCase() === 'female' ? '/girl.png' : '/boy.png';
                  }

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/70 transition-colors border border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={avatarUrl}
                          alt={m.user.full_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                            {m.user.full_name || 'Student Member'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block sm:hidden">
                            {formatBranchName(m.user.branch)}
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:block text-xs font-medium text-slate-600 truncate max-w-xs px-2">
                        {formatBranchName(m.user.branch)}
                      </div>

                      <div className="shrink-0">
                        <Badge
                          className={`text-[10px] font-bold capitalize ${
                            m.role.toLowerCase().includes('lead') || m.role.toLowerCase().includes('admin')
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {m.role || 'Member'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 4: RESOURCES & COMMUNITY
           ========================================================================= */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  Official Community Channels
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Connect with fellow members and core committee leads.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      WA
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">WhatsApp Community</p>
                      <p className="text-[10px] text-slate-500">Member announcements & quick chat</p>
                    </div>
                  </div>
                  {isMember ? (
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                      Join Group
                    </Button>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500 text-[10px]">Members Only</Badge>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      DC
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Discord Server</p>
                      <p className="text-[10px] text-slate-500">Dev syncs, voice channels & projects</p>
                    </div>
                  </div>
                  {isMember ? (
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                      Join Server
                    </Button>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500 text-[10px]">Members Only</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Shared Learning Materials
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Slide decks, GitHub repos, and workshop resources.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">GitHub Organization & Repos</p>
                    <p className="text-[10px] text-slate-500">Open-source campus projects & codebases</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                    View GitHub
                  </Button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Workshop Slide Decks & Drive</p>
                    <p className="text-[10px] text-slate-500">Handouts, cheat-sheets, and study kits</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                    Open Drive
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ================= LEAVE CONFIRMATION MODAL ================= */}
      <Dialog open={leaveModalOpen} onOpenChange={setLeaveModalOpen}>
        <DialogContent className="max-w-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-xl">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-base font-bold text-slate-900">
              Leave {club.name}?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to leave? You will lose access to member notices and internal club community links.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeaveModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleLeave}
              disabled={leaving}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
            >
              {leaving ? 'Leaving...' : 'Confirm Leave'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
