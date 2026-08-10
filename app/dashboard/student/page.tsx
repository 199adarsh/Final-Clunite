'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getUserFromDatabase } from '@/lib/sync-user';
import { getUserAvatarUrl } from '@/lib/avatar-utils';
import { supabase } from '@/lib/supabase';

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
  Star,
  Target,
  Sparkles,
  Loader2,
  MessageCircle,
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
    attendedEvents: 0,
    certificates: 0,
    qrScans: 0
  });
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      router.push('/login');
      return;
    }

    async function fetchDashboardData() {
      try {
        setLoading(true);
        const dbUser = await getUserFromDatabase(authUser!.id);
        setUserData(dbUser);

        // Fetch user registration stats
        const { data: regs, error: regsError } = await supabase
          .from('event_registrations')
          .select(`
            id,
            status,
            event:events(id, certificates_enabled)
          `)
          .eq('user_id', authUser!.id);

        if (!regsError && regs) {
          const registeredEvents = regs.length;
          const attendedEvents = regs.filter((r) => r.status === 'attended').length;
          const certificates = regs.filter((r) => r.status === 'attended' && (r.event as any)?.certificates_enabled).length;
          const qrScans = regs.filter((r) => r.status === 'attended').length;

          setStats({
            registeredEvents,
            attendedEvents,
            certificates,
            qrScans
          });
        }

        // Fetch recommended events
        const now = new Date().toISOString();
        const { data: allEvents, error: eventsError } = await supabase
          .from('events')
          .select(`
            *,
            club:clubs(*)
          `)
          .eq('status', 'published')
          .gt('registration_deadline', now);

        if (!eventsError && allEvents) {
          const userCollege = dbUser?.college?.toLowerCase() || '';
          const userBranch = dbUser?.branch?.toLowerCase() || '';
          
          const sorted = [...allEvents].sort((a: any, b: any) => {
            let scoreA = 0;
            let scoreB = 0;

            if (a.college?.toLowerCase() === userCollege) scoreA += 10;
            if (b.college?.toLowerCase() === userCollege) scoreB += 10;

            if (a.title?.toLowerCase().includes(userBranch) || a.description?.toLowerCase().includes(userBranch)) scoreA += 5;
            if (b.title?.toLowerCase().includes(userBranch) || b.description?.toLowerCase().includes(userBranch)) scoreB += 5;

            return scoreB - scoreA;
          });

          setRecommended(sorted.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
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

  const achievementsList = [
    {
      title: 'Registered Events',
      value: stats.registeredEvents.toString(),
      change: `${stats.registeredEvents} total`,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Certificates Earned',
      value: stats.certificates.toString(),
      change: `${stats.certificates} total`,
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Events Attended',
      value: stats.attendedEvents.toString(),
      change: `${stats.attendedEvents} total`,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'QR Scans',
      value: stats.qrScans.toString(),
      change: `${stats.qrScans} total`,
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

          <div className="mt-4 space-y-2 font-medium">
            <Badge className="bg-blue-100 text-blue-700">
              <Sparkles className="h-3 w-3 mr-1" /> {recommended.length} recommendations
            </Badge>

            <Badge className="bg-indigo-100 text-indigo-700 ml-2">
              <Target className="h-3 w-3 mr-1" /> {stats.registeredEvents} events registered
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
          {achievementsList.map((item, index) => (
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

              <p className="text-xs text-muted-foreground">{item.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN + SIDE */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* MAIN — Social feed, cleaner & modern */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Recommended Events for You
            </h2>

            <Badge className="bg-blue-100 text-blue-700">Personalized</Badge>
          </div>

          {recommended.length === 0 ? (
            <Card className="rounded-2xl border border-black/5 bg-white p-8 text-center text-muted-foreground">
              No recommended events found right now. Check back later!
            </Card>
          ) : (
            recommended.map((event) => {
              const eventDate = new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const eventTime = new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const eventVenue = event.venue || event.location || 'TBD';
              const clubName = event.club?.name || 'Unknown Club';
              const rating = (event.club?.credibility_score || 4.8).toFixed(1);

              return (
                <div
                  key={event.id}
                  className="
                    rounded-xl
                    border border-black/10
                    bg-white
                    shadow-sm
                    hover:shadow-xl
                    hover:-translate-y-0.5
                    transition
                    overflow-hidden
                  "
                >
                  {/* CARD HEADER */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-200 flex items-center justify-center font-semibold">
                        {clubName[0]}
                      </div>

                      <div>
                        <p className="text-sm font-medium">{clubName}</p>
                        <p className="text-xs text-muted-foreground">
                          posted an event
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-purple-100 text-purple-700">
                      ⭐ {rating}
                    </Badge>
                  </div>

                  {/* EVENT IMAGE */}
                  <div className="h-44 bg-gray-100">
                    <img
                      src={event.image_url || "https://images.unsplash.com/photo-1523240795612-9a054b0db644"}
                      className="w-full h-full object-cover"
                      alt="event"
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-semibold text-lg">{event.title}</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {eventDate}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {eventTime}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {eventVenue}
                      </span>
                    </div>

                    {/* TAGS */}
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-orange-100 text-orange-700">
                        🔥 Popular
                      </Badge>

                      {event.max_participants && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          🎯 Max: {event.max_participants}
                        </Badge>
                      )}
                    </div>

                    {/* PEOPLE INTERESTED */}
                    <div className="flex items-center gap-2 mt-3">
                      <p className="text-xs text-muted-foreground font-semibold">
                        {event.current_participants || 0} students registered so far
                      </p>
                    </div>

                    {/* ACTION BAR */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-red-500">
                          <Heart className="h-4 w-4" /> Like
                        </button>

                        <button className="flex items-center gap-1 hover:text-gray-900">
                          <Share2 className="h-4 w-4" /> Share
                        </button>
                      </div>

                      <Link href={`/dashboard/student/events/${event.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Register
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* SIDE */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="rounded-2xl overflow-hidden border border-black/10 bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 mt-2">
              <Button className="w-full justify-start rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                <QrCode className="h-4 w-4 mr-2" />
                Scan event QR
              </Button>

              <Link href="/dashboard/student/events" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-lg"
                >
                  <Award className="h-4 w-4 mr-2 text-emerald-600" />
                  Certificates
                </Button>
              </Link>

              <Link href="/dashboard/student/events" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-lg"
                >
                  <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                  My events
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Invite */}
          <Card className="rounded-2xl overflow-hidden border border-blue-200 bg-blue-50">
            <CardContent className="p-6 space-y-2">
              <p className="font-medium">Invite friends</p>
              <p className="text-sm text-muted-foreground">
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
                <p className="font-medium">Achievement unlocked</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You’ve attended {stats.attendedEvents} events this semester.
              </p>
              <Button size="sm" variant="outline" className="rounded-lg">
                View progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
