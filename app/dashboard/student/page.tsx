'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserFromDatabase } from '@/lib/sync-user';
import { getUserAvatarUrl } from '@/lib/avatar-utils';
import { supabase } from '@/lib/supabase';
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
  Target,
  Sparkles,
  Loader2,
  Share2,
  Heart,
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    registeredEvents: 0,
    certificatesEarned: 0,
    eventsAttended: 0,
    qrScans: 0,
    registeredEventsThisMonth: 0,
    certificatesEarnedThisSemester: 0,
    eventsAttendedThisMonth: 0,
    qrScansRecent: 0,
  });
  const [eventsThisWeek, setEventsThisWeek] = useState(0);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      router.push('/login');
      return;
    }

    async function loadDashboardData() {
      try {
        setLoading(true);
        // 1. Fetch User Data
        const dbUser = await getUserFromDatabase(authUser!.id);
        setUserData(dbUser);

        // 2. Fetch User Registrations and their linked events
        const { data: regs, error: regsError } = await supabase
          .from('event_registrations')
          .select(`
            id,
            status,
            registered_at,
            events(
              id,
              title,
              start_date,
              contact_info
            )
          `)
          .eq('user_id', authUser!.id);

        if (regsError) {
          console.error('Error fetching registrations:', regsError);
        }

        const activeRegs = regs ? regs.filter((r: any) => r.status !== 'cancelled') : [];
        const attendedRegs = regs ? regs.filter((r: any) => r.status === 'attended') : [];

        // Calculate dynamic stats
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const hundredTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const registeredThisMonth = activeRegs.filter((r: any) => new Date(r.registered_at) >= thirtyDaysAgo).length;
        const certificatesThisSemester = attendedRegs.filter((r: any) => new Date(r.registered_at) >= hundredTwentyDaysAgo).length;
        const attendedThisMonth = attendedRegs.filter((r: any) => new Date(r.registered_at) >= thirtyDaysAgo).length;
        const qrScansRecent = attendedRegs.filter((r: any) => new Date(r.registered_at) >= sevenDaysAgo).length;

        setStats({
          registeredEvents: activeRegs.length,
          certificatesEarned: attendedRegs.length,
          eventsAttended: attendedRegs.length,
          qrScans: attendedRegs.length,
          registeredEventsThisMonth: registeredThisMonth,
          certificatesEarnedThisSemester: certificatesThisSemester,
          eventsAttendedThisMonth: attendedThisMonth,
          qrScansRecent: qrScansRecent,
        });

        // Calculate events starting within next 7 days
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weekCount = activeRegs.filter((r: any) => {
          if (!r.events?.start_date) return false;
          const eventDate = new Date(r.events.start_date);
          return eventDate >= now && eventDate <= sevenDaysFromNow;
        }).length;
        setEventsThisWeek(weekCount);

        // 3. Fetch Recommended Events (Published)
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            club:clubs(*),
            event_registrations(
              id,
              status,
              user_id,
              user:users(
                id,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('status', 'published');

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        }

        const userCollege = dbUser?.college?.toLowerCase();

        // Suggest only live events whose last date (registration_deadline) has not been crossed
        const activeEvents = (eventsData || []).filter((event: any) => {
          if (!event.registration_deadline) return true;
          return new Date(event.registration_deadline) >= now;
        });

        const formattedEvents = activeEvents
          // Sort events: put student's college events first, then sort by start_date descending
          .sort((a: any, b: any) => {
            const aIsSameCollege = a.college?.toLowerCase() === userCollege;
            const bIsSameCollege = b.college?.toLowerCase() === userCollege;
            if (aIsSameCollege && !bIsSameCollege) return -1;
            if (!aIsSameCollege && bIsSameCollege) return 1;
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
          })
          .map((event: any) => {
            // Filter out cancelled registrations to get active participants
            const activeRegistrations = (event.event_registrations || []).filter(
              (reg: any) => reg.status !== 'cancelled'
            );

            // Get initials of registered users
            const attendeesInitials = activeRegistrations
              .map((reg: any) => {
                const fullName = reg.user?.full_name || 'Student';
                return fullName.trim().charAt(0).toUpperCase();
              })
              .slice(0, 4);

            // Find current user's registration status
            const currentUserReg = (event.event_registrations || []).find(
              (reg: any) => reg.user_id === authUser!.id
            );
            const userRegistrationStatus = currentUserReg ? currentUserReg.status : null;

            // Date & Time formatting
            const startDate = new Date(event.start_date);
            const formattedDate = startDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = startDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            // Closed status checks
            const isFinished = event.status === 'completed' || new Date(event.end_date || event.start_date) < now;
            const isDeadlinePassed = new Date(event.registration_deadline) < now;
            const isRegistrationClosed = isFinished || isDeadlinePassed;

            // Calculate days left for registration
            let daysLeftText = '';
            if (event.registration_deadline) {
              const deadlineDate = new Date(event.registration_deadline);
              const diffTime = deadlineDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 0) {
                daysLeftText = diffDays === 1 ? '1 day left' : `${diffDays} days left`;
              } else if (diffDays === 0) {
                daysLeftText = 'Closes today';
              }
            }

            return {
              id: event.id,
              title: event.title,
              club: event.club?.name || 'Clunite Club',
              clubLogo: event.club?.logo_url,
              date: formattedDate,
              time: formattedTime,
              venue: event.venue || 'TBA',
              rating: event.club?.credibility_score ? (event.club.credibility_score / 20).toFixed(1) : '4.5',
              attendees: attendeesInitials,
              totalAttendeesCount: activeRegistrations.length,
              userRegistrationStatus,
              image_url: event.image_url,
              isRegistrationClosed,
              daysLeftText,
            };
          });

        setRecommendedEvents(formattedEvents);

      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [authUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const user = {
    name: userData?.full_name || 'Student',
    college: userData?.college || 'Your College',
  };

  const avatarUrl = getUserAvatarUrl(userData);

  const achievements = [
    {
      title: 'Registered Events',
      value: stats.registeredEvents.toString(),
      change: stats.registeredEventsThisMonth > 0 
        ? `+${stats.registeredEventsThisMonth} this month` 
        : 'No recent registrations',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Certificates Earned',
      value: stats.certificatesEarned.toString(),
      change: stats.certificatesEarnedThisSemester > 0
        ? `+${stats.certificatesEarnedThisSemester} this semester`
        : 'No new certificates',
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Events Attended',
      value: stats.eventsAttended.toString(),
      change: stats.eventsAttendedThisMonth > 0
        ? `+${stats.eventsAttendedThisMonth} this month`
        : 'No recent events',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'QR Scans',
      value: stats.qrScans.toString(),
      change: stats.qrScansRecent > 0
        ? `+${stats.qrScansRecent} recent`
        : 'No recent scans',
      icon: QrCode,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-8 py-6 space-y-10">
      {/* HERO */}
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-white border border-black/5 p-10 overflow-hidden">
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground">Dashboard Overview</p>

          <h1 className="text-4xl font-semibold tracking-tight mt-1">
            Hello {user.name}
          </h1>

          <p className="text-sm text-muted-foreground mt-2">
            Stay updated, join events & connect with your community.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
              <Sparkles className="h-3 w-3 mr-1" />
              {recommendedEvents.length} recommendations
            </Badge>

            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">
              <Target className="h-3 w-3 mr-1" />
              {eventsThisWeek} {eventsThisWeek === 1 ? 'event' : 'events'} this week
            </Badge>
          </div>
        </div>

        <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-120 flex items-center justify-end pr-6">
          <div className="h-full w-full max-w-[300px] flex items-center justify-center">
            <img
              src={avatarUrl || '/user_greet.png'}
              alt="Dashboard illustration"
              className="h-full w-full object-contain object-bottom"
            />
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      <div className="rounded-2xl bg-white border border-black/5 p-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl border border-black/5 p-6 space-y-4 ${item.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">
                  Achievement
                </span>
              </div>

              <div>
                <p className="text-3xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="text-sm text-muted-foreground">{item.title}</p>
              </div>

              <p className="text-xs text-muted-foreground font-medium">{item.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN + SIDE */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* MAIN — Social feed */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Explore events around you
            </h2>

            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Live updates</Badge>
          </div>

          {recommendedEvents.length === 0 ? (
            <Card className="rounded-xl border border-black/10 bg-white p-8 text-center">
              <p className="text-muted-foreground font-medium">No active recommended events found.</p>
            </Card>
          ) : (
            <div className="space-y-5">
              {recommendedEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="
                    rounded-xl
                    border border-black/10
                    bg-white
                    shadow-sm
                    hover:shadow-md
                    transition
                    overflow-hidden
                  "
                >
                  {/* CARD HEADER */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {event.clubLogo ? (
                        <img
                          src={event.clubLogo}
                          className="h-9 w-9 rounded-full object-cover border"
                          alt="club logo"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-indigo-200 flex items-center justify-center font-semibold">
                          {event.club[0]}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium">{event.club}</p>
                        <p className="text-xs text-muted-foreground">
                          posted an event
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">
                      ⭐ {event.rating}
                    </Badge>
                  </div>

                  {/* EVENT IMAGE */}
                  <div className="h-44 bg-gray-100">
                    <img
                      src={event.image_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644'}
                      className="w-full h-full object-cover"
                      alt="event"
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-semibold text-lg text-slate-900">{event.title}</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {event.date}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.time}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venue}
                      </span>
                    </div>

                    {/* TAGS */}
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                        🔥 Popular
                      </Badge>

                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                        🎯 Limited seats
                      </Badge>

                      {event.daysLeftText && (
                        <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none font-medium">
                          ⏳ {event.daysLeftText}
                        </Badge>
                      )}
                    </div>

                    {/* PEOPLE INTERESTED */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-2">
                        {event.attendees.map((a: string, i: number) => (
                          <div
                            key={i}
                            className="h-7 w-7 rounded-full bg-indigo-200 border border-white flex items-center justify-center text-xs font-semibold text-indigo-700"
                          >
                            {a}
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground font-medium">
                        {event.totalAttendeesCount === 0 && 'Be the first to register!'}
                        {event.totalAttendeesCount === 1 && '1 student registered'}
                        {event.totalAttendeesCount > 1 && event.totalAttendeesCount <= 4 && `${event.totalAttendeesCount} students registered`}
                        {event.totalAttendeesCount > 4 && `+${event.totalAttendeesCount - 4} more students registered`}
                      </p>
                    </div>

                    {/* ACTION BAR */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-red-500 transition">
                          <Heart className="h-4 w-4" /> Like
                        </button>

                        <button className="flex items-center gap-1 hover:text-gray-900 transition">
                          <Share2 className="h-4 w-4" /> Share
                        </button>
                      </div>

                      <Button 
                        size="sm" 
                        disabled={event.isRegistrationClosed && (!event.userRegistrationStatus || event.userRegistrationStatus === 'cancelled')}
                        className={cn(
                          event.userRegistrationStatus === 'registered' && "bg-emerald-600 hover:bg-emerald-700 text-white font-medium",
                          event.userRegistrationStatus === 'waitlisted' && "bg-amber-500 hover:bg-amber-600 text-white font-medium",
                          event.userRegistrationStatus === 'attended' && "bg-indigo-600 hover:bg-indigo-700 text-white font-medium",
                          event.isRegistrationClosed && (!event.userRegistrationStatus || event.userRegistrationStatus === 'cancelled') && "bg-gray-300 text-gray-500 cursor-not-allowed font-medium",
                          !event.isRegistrationClosed && (!event.userRegistrationStatus || event.userRegistrationStatus === 'cancelled') && "bg-blue-600 hover:bg-blue-700 font-medium"
                        )}
                        onClick={() => router.push(`/dashboard/student/events/${event.id}`)}
                      >
                        {event.userRegistrationStatus === 'registered' && 'Registered'}
                        {event.userRegistrationStatus === 'waitlisted' && 'Waitlisted'}
                        {event.userRegistrationStatus === 'attended' && 'Attended'}
                        {event.userRegistrationStatus === 'cancelled' && (event.isRegistrationClosed ? 'Registration Closed' : 'Register')}
                        {!event.userRegistrationStatus && (event.isRegistrationClosed ? 'Registration Closed' : 'Register')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center pt-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl border-black/10 text-slate-700 hover:bg-slate-50 bg-white font-medium w-full py-6 text-sm"
                  onClick={() => router.push('/dashboard/student/browse')}
                >
                  View all recommended events ({recommendedEvents.length})
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SIDE */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="rounded-2xl overflow-hidden border border-black/10 bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-slate-900 text-lg">Quick actions</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 mt-2">
              <Button 
                className="w-full justify-start rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/dashboard/student/qr')}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan event QR
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start rounded-lg"
                onClick={() => router.push('/dashboard/student/certificates')}
              >
                <Award className="h-4 w-4 mr-2 text-emerald-600" />
                Certificates
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start rounded-lg"
                onClick={() => router.push('/dashboard/student/browse')}
              >
                <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                My events
              </Button>
            </CardContent>
          </Card>

          {/* Invite */}
          <Card className="rounded-2xl overflow-hidden border border-blue-200 bg-blue-50">
            <CardContent className="p-6 space-y-2">
              <p className="font-semibold text-blue-900">Invite friends</p>
              <p className="text-sm text-blue-700/80">
                Grow the club — share access.
              </p>
              <Button
                size="sm"
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                Share invite
              </Button>
            </CardContent>
          </Card>

          {/* Achievement */}
          <Card className="rounded-2xl overflow-hidden border border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-700" />
                <p className="font-semibold text-emerald-950">Achievement unlocked</p>
              </div>
              <p className="text-sm text-emerald-800">
                You’ve attended {stats.eventsAttended} {stats.eventsAttended === 1 ? 'event' : 'events'} this semester.
              </p>
              <Button size="sm" variant="outline" className="rounded-lg border-emerald-300 text-emerald-800 hover:bg-emerald-100 bg-white">
                View progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
