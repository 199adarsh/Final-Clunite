'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  BarChart3,
  Plus,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Clock,
  Target,
  ChevronDown,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HostEventPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [userClubs, setUserClubs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    attendanceRate: 0,
    engagementRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Get selected club from session
    const clubId = sessionStorage.getItem('selectedClubId');
    const clubName = sessionStorage.getItem('selectedClubName');

    if (!clubId || !clubName) {
      // No club selected, redirect to club selection
      router.push('/dashboard/organizer/select-club');
      return;
    }

    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
    fetchClubStats(clubId);
  }, []);

  useEffect(() => {
    if (authUser) {
      loadUserClubs();
    }
  }, [authUser]);

  const loadUserClubs = async () => {
    try {
      if (!authUser) return;

      const { data: memberships, error: membershipsError } = await supabase
        .from('club_memberships')
        .select(`
          club:clubs(id, name)
        `)
        .eq('user_id', authUser.id)
        .eq('role', 'admin');

      const { data: createdClubs, error: createdClubsError } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('created_by', authUser.id);

      if (!membershipsError || !createdClubsError) {
        const clubsFromMemberships = (memberships || [])
          .map((m: any) => m.club)
          .filter((club: any) => club && club.id);
        const clubsFromCreated = createdClubs || [];

        // Combine and deduplicate
        const allClubs = [...clubsFromMemberships, ...clubsFromCreated];
        const uniqueClubs = Array.from(
          new Map(allClubs.map((club) => [club.id, club])).values()
        );

        setUserClubs(uniqueClubs);
      }
    } catch (err) {
      console.error('Error loading clubs:', err);
    }
  };

  const switchClub = (clubId: string, clubName: string) => {
    sessionStorage.setItem('selectedClubId', clubId);
    sessionStorage.setItem('selectedClubName', clubName);
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
    setLoading(true);
    fetchClubStats(clubId);
  };

  const fetchClubStats = async (clubId: string) => {
    try {
      setLoading(true);

      // Check if user is owner of the selected club
      if (authUser) {
        const { data: membership } = await supabase
          .from('club_memberships')
          .select('is_owner')
          .eq('user_id', authUser.id)
          .eq('club_id', clubId)
          .maybeSingle();
        
        setIsOwner(membership?.is_owner || false);
      }

      // Fetch events for this club
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, current_participants')
        .eq('club_id', clubId);

      if (eventsError) throw eventsError;

      const eventIds = events?.map((e: any) => e.id) || [];

      // Fetch registrations for these events
      let activeParticipantCount = 0;
      let attendedParticipantCount = 0;

      if (eventIds.length > 0) {
        const { data: regs, error: regsError } = await supabase
          .from('event_registrations')
          .select('status, registration_data')
          .in('event_id', eventIds);

        if (!regsError && regs) {
          regs.forEach((reg: any) => {
            if (reg.status === 'cancelled') return;

            let count = 1;
            if (reg.registration_data?.team_members && Array.isArray(reg.registration_data.team_members)) {
              count = reg.registration_data.team_members.length;
            }

            activeParticipantCount += count;
            if (reg.status === 'attended') {
              attendedParticipantCount += count;
            }
          });
        }
      }

      const totalEvents = events?.length || 0;
      const totalRegistrations = activeParticipantCount;
      const attendanceRate =
        activeParticipantCount > 0
          ? Math.round((attendedParticipantCount / activeParticipantCount) * 100)
          : 0;
      const engagementRate =
        totalEvents > 0 && activeParticipantCount > 0
          ? Math.round((activeParticipantCount / totalEvents) * 10)
          : 0;

      setStats({
        totalEvents,
        totalRegistrations,
        attendanceRate,
        engagementRate: Math.min(engagementRate, 100),
      });
    } catch (error) {
      console.error('Error fetching club stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-8 py-6 space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header with Club Switcher */}
        <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              {userClubs.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {selectedClubName}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {userClubs.map((club) => (
                      <DropdownMenuItem
                        key={club.id}
                        onClick={() => switchClub(club.id, club.name)}
                        className={
                          selectedClubId === club.id ? 'bg-indigo-100' : ''
                        }
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{club.name}</span>
                          {selectedClubId === club.id && (
                            <Badge className="ml-2 bg-indigo-600">Current</Badge>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-semibold border-indigo-200">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  {selectedClubName}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Event Management Hub
            </h1>
            <p className="text-gray-600 font-medium">
              Create engaging events and track your success with powerful analytics.
            </p>
          </div>
          {isOwner && (
            <Link href="/dashboard/organizer/manage-admins">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Users className="h-5 w-5 mr-2" />
                Manage Admins
              </Button>
            </Link>
          )}
        </div>

        {/* Colorful Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Calendar,
              label: 'Total Events',
              value: loading ? '...' : stats.totalEvents.toString(),
              trend: '+18%',
              desc: 'Events hosted',
              gradient: 'from-blue-500 to-blue-600',
            },
            {
              icon: Users,
              label: 'Registrations',
              value: loading ? '...' : stats.totalRegistrations.toString(),
              trend: '+5%',
              desc: 'Sign-ups received',
              gradient: 'from-purple-500 to-purple-600',
            },
            {
              icon: TrendingUp,
              label: 'Attendance',
              value: loading ? '...' : `${stats.attendanceRate}%`,
              trend: '+8%',
              desc: 'Average rate',
              gradient: 'from-green-500 to-green-600',
            },
            {
              icon: Award,
              label: 'Engagement',
              value: loading ? '...' : `${stats.engagementRate}%`,
              trend: '-2%',
              desc: 'Interaction level',
              gradient: 'from-violet-500 to-purple-600',
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className={`border-none shadow-sm rounded-2xl bg-gradient-to-br ${stat.gradient} text-white hover:shadow-md transition`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      stat.trend.startsWith('+') ? 'bg-white/30' : 'bg-white/20'
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm font-medium text-white/90">
                    {stat.label}
                  </p>
                  <p className="text-xs text-white/70 mt-1">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Cards - elevated, modern, with subtle animated accents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Host New Event Card */}
          <Card className="relative bg-white/95 border border-slate-200/60 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between min-h-[320px] group">
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-indigo-500/5 blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Plus className="h-6 w-6" />
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold border-indigo-200 rounded-full px-3 py-1 text-xs">
                  Quick Start
                </Badge>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Host New Event
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Create engaging events for your campus. Set up workshops, competitions, seminars, and more in minutes.
                </p>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 mt-6">
              {/* Stats Indicators */}
              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  5 min Setup
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  100% Digital
                </span>
              </div>

              <Link href="/dashboard/organizer/host/create" className="shrink-0">
                <Button className="bg-slate-950 hover:bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-full shadow-sm hover:shadow hover:text-white transition-all duration-200 flex items-center gap-2 group/btn">
                  <span>Create Event</span>
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Organizers Panel Card */}
          <Card className="relative bg-white/95 border border-slate-200/60 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300 flex flex-col justify-between min-h-[320px] group">
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-purple-500/5 blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold border-purple-200 rounded-full px-3 py-1 text-xs">
                  Analytics
                </Badge>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Organizers Panel
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Comprehensive analytics dashboard for all your events. Track performance, registrations, and engagement.
                </p>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 mt-6">
              {/* Stats Indicators */}
              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Real-time Tracking
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  AI Insights
                </span>
              </div>

              <Link href="/dashboard/organizer/host/analytics" className="shrink-0">
                <Button className="bg-slate-950 hover:bg-purple-600 text-white font-bold px-6 py-2.5 rounded-full shadow-sm hover:shadow hover:text-white transition-all duration-200 flex items-center gap-2 group/btn">
                  <span>View Analytics</span>
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Event Participants Dashboard Card */}
          <Card className="relative bg-white/95 border border-slate-200/60 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between min-h-[320px] group">
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Users className="h-6 w-6" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border-emerald-200 rounded-full px-3 py-1 text-xs">
                  Management
                </Badge>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Participants Hub
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Monitor registrations, track attendee presence, and manage participant logs effectively.
                </p>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 mt-6">
              {/* Stats Indicators */}
              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Track Registrations
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Manage Attendance
                </span>
              </div>

              <Link href="/dashboard/organizer" className="shrink-0">
                <Button className="bg-slate-950 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-full shadow-sm hover:shadow hover:text-white transition-all duration-200 flex items-center gap-2 group/btn">
                  <span>Manage Participants</span>
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Bulk Certificates & Distribution Card */}
          <Card className="relative bg-white/95 border border-slate-200/60 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between min-h-[320px] group">
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-amber-500/5 blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                  <Award className="h-6 w-6" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold border-amber-200 rounded-full px-3 py-1 text-xs">
                  Certificates
                </Badge>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Bulk Certificates
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Design, generate, and distribute verified digital certificates in bulk to attended event participants with automated delivery.
                </p>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 mt-6">
              {/* Stats Indicators */}
              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Auto-Generation
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  1-Click Dispatch
                </span>
              </div>

              <Link href="/dashboard/organizer/host/certificates" className="shrink-0">
                <Button className="bg-slate-950 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-full shadow-sm hover:shadow hover:text-white transition-all duration-200 flex items-center gap-2 group/btn">
                  <span>Issue Certificates</span>
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
