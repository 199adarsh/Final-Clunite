'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  Users,
  Trophy,
  Globe,
  Monitor,
  MapPin,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  List,
  RotateCcw,
  ChevronRight,
  Filter,
  CheckCircle2,
  Tag,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { supabase, type Event, type Club } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getUserFromDatabase } from '@/lib/sync-user';
import { cn } from '@/lib/utils';

interface EventWithClub extends Event {
  club?: Club | null;
}

const avatarColors = [
  'bg-indigo-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-blue-600',
  'bg-amber-600',
  'bg-rose-600',
];

/* Helper to compute deadline & live status */
function getEventStatusInfo(event: Event) {
  const now = new Date();
  const deadlineStr = event.registration_deadline || event.start_date;

  if (!deadlineStr) {
    return {
      isLive: true,
      statusLabel: 'Live • Open',
      daysLeftText: 'Open for registration',
      urgency: 'normal' as const,
    };
  }

  const deadline = new Date(deadlineStr);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0 || event.status === 'completed' || event.status === 'cancelled') {
    return {
      isLive: false,
      statusLabel: 'Registration Closed',
      daysLeftText: 'Closed',
      urgency: 'closed' as const,
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      isLive: true,
      statusLabel: 'Live Now',
      daysLeftText: diffHours <= 1 ? 'Ends in < 1 hr' : `Ends in ${diffHours}h`,
      urgency: 'critical' as const,
    };
  } else if (diffDays <= 3) {
    return {
      isLive: true,
      statusLabel: 'Live Now',
      daysLeftText: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`,
      urgency: 'urgent' as const,
    };
  } else {
    return {
      isLive: true,
      statusLabel: 'Live Now',
      daysLeftText: `${diffDays} days left`,
      urgency: 'normal' as const,
    };
  }
}

export default function BrowseEventsPage() {
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [events, setEvents] = useState<EventWithClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventAttendees, setEventAttendees] = useState<Record<string, { users: Array<{ id: string; name: string; initials: string }>; totalCount: number }>>({});

  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'closed'>('all');
  const [campusFilter, setCampusFilter] = useState<'all' | 'my_college' | 'inter_college'>('all');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [mode, setMode] = useState('all');
  const [sortBy, setSortBy] = useState<'upcoming' | 'popular' | 'prize' | 'fee_asc'>('upcoming');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (authUser) {
      getUserFromDatabase(authUser.id).then(setUserData);
    }
  }, [authUser]);

  useEffect(() => {
    fetchEventsAndAttendees();
  }, []);

  const fetchEventsAndAttendees = async () => {
    try {
      setLoading(true);
      const [eventsRes, attendeesRes] = await Promise.all([
        supabase
          .from('events')
          .select('*, club:clubs(*)')
          .order('start_date', { ascending: true }),

        supabase
          .from('event_registrations')
          .select('id, event_id, user_id, status, user:users(id, full_name, college, branch)')
          .in('status', ['registered', 'attended'])
          .limit(400),
      ]);

      const loadedEvents = eventsRes.data || [];
      setEvents(loadedEvents);

      // Process Attendees
      const attendeesMap: Record<string, { users: Array<{ id: string; name: string; initials: string }>; totalCount: number }> = {};
      (attendeesRes.data || []).forEach((reg: any) => {
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
    } catch (err) {
      console.error('Error loading browse events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase().trim();
    const userCollege = (userData?.college || '').toLowerCase().trim();

    let result = events.filter((e) => {
      const statusInfo = getEventStatusInfo(e);
      const eventCollege = (e.college || e.club?.college || '').toLowerCase().trim();
      const isMyCollege = userCollege && (eventCollege.includes(userCollege) || userCollege.includes(eventCollege));

      // Live / Closed Filter
      if (statusFilter === 'live' && !statusInfo.isLive) return false;
      if (statusFilter === 'closed' && statusInfo.isLive) return false;

      // Campus Filter
      if (campusFilter === 'my_college' && !isMyCollege) return false;
      if (campusFilter === 'inter_college' && isMyCollege) return false;

      // Search
      const matchSearch =
        !q ||
        e.title?.toLowerCase().includes(q) ||
        e.club?.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.college?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Dropdown filters
      if (category !== 'all' && e.category !== category) return false;
      if (type !== 'all' && e.type !== type) return false;
      if (mode !== 'all' && e.mode !== mode) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') {
        const countA = eventAttendees[a.id]?.totalCount || a.current_participants || 0;
        const countB = eventAttendees[b.id]?.totalCount || b.current_participants || 0;
        return countB - countA;
      }
      if (sortBy === 'prize') {
        return (Number(b.prize_pool) || 0) - (Number(a.prize_pool) || 0);
      }
      if (sortBy === 'fee_asc') {
        return (Number(a.entry_fee) || 0) - (Number(b.entry_fee) || 0);
      }
      // default: upcoming soonest
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB;
    });

    return result;
  }, [events, search, statusFilter, campusFilter, category, type, mode, sortBy, eventAttendees, userData]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCampusFilter('all');
    setCategory('all');
    setType('all');
    setMode('all');
    setSortBy('upcoming');
  };

  const isFiltered =
    search !== '' ||
    statusFilter !== 'all' ||
    campusFilter !== 'all' ||
    category !== 'all' ||
    type !== 'all' ||
    mode !== 'all' ||
    sortBy !== 'upcoming';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Calendar className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading campus events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ================= HERO HEADER ================= */}
      <div className="relative rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
              Campus Event Directory
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Discover Campus Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Explore hackathons, workshops, cultural fests, and club competitions across campuses.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/90 backdrop-blur rounded-xl border border-slate-200 px-4 py-2 text-center shadow-xs">
            <p className="text-xs font-semibold text-slate-500">Available Events</p>
            <p className="text-xl font-extrabold text-slate-900">{filteredEvents.length}</p>
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="space-y-3">
        {/* Main Controls Card */}
        <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-medium"
                placeholder="Search events, clubs, colleges, venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Campus Scope Dropdown */}
              <Select value={campusFilter} onValueChange={(val: any) => setCampusFilter(val)}>
                <SelectTrigger className="w-[130px] h-10 rounded-xl text-xs font-semibold border-slate-200 bg-white">
                  <SelectValue placeholder="Campus Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campuses</SelectItem>
                  <SelectItem value="my_college">My College</SelectItem>
                  <SelectItem value="inter_college">Inter-College</SelectItem>
                </SelectContent>
              </Select>

              {/* Status (Live vs Closed) Dropdown */}
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-[125px] h-10 rounded-xl text-xs font-semibold border-slate-200 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="live">Live & Open</SelectItem>
                  <SelectItem value="closed">Closed / Past</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Dropdown */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[125px] h-10 rounded-xl text-xs font-semibold border-slate-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                </SelectContent>
              </Select>

              {/* Mode Dropdown */}
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-[110px] h-10 rounded-xl text-xs font-semibold border-slate-200">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By Dropdown */}
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="w-[150px] h-10 rounded-xl text-xs font-semibold border-slate-200">
                  <span className="flex items-center gap-1 text-slate-700 truncate">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Sort" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming Soonest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="prize">Highest Prize Pool</SelectItem>
                  <SelectItem value="fee_asc">Free First</SelectItem>
                </SelectContent>
              </Select>

              {/* Grid / List View Toggle */}
              <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  )}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Reset Filters Button */}
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-10 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                  title="Reset all filters"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= EVENTS CONTENT ================= */}
      {filteredEvents.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Events Match Your Filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, switching campus or live status, or clearing active filters.
          </p>
          <Button
            onClick={handleResetFilters}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold mt-2"
          >
            Clear All Filters
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const attendees = eventAttendees[event.id] || { users: [], totalCount: 0 };
            const statusInfo = getEventStatusInfo(event);
            const collegeName = event.college || event.club?.college || 'DKTE Society\'s TEI';

            return (
              <Link key={event.id} href={`/dashboard/student/events/${event.id}`} className="block group">
                <Card className={cn(
                  "h-full rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between",
                  statusInfo.isLive ? "border-slate-200/80 hover:border-indigo-200" : "border-slate-200/50 opacity-85 hover:opacity-100"
                )}>
                  <div>
                    {/* Event Banner Image Header */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={event.image_url || '/placeholder.svg'}
                        alt={event.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className="bg-white/95 backdrop-blur text-slate-900 border-none text-[10px] font-bold capitalize shadow-xs">
                            {event.type || 'Event'}
                          </Badge>

                          <Badge
                            className={cn(
                              'text-[10px] font-bold capitalize shadow-xs border-none',
                              event.mode === 'online'
                                ? 'bg-blue-600 text-white'
                                : event.mode === 'hybrid'
                                ? 'bg-purple-600 text-white'
                                : 'bg-indigo-600 text-white'
                            )}
                          >
                            {event.mode || 'offline'}
                          </Badge>
                        </div>

                        {/* Live / Days Left Badge */}
                        <Badge
                          className={cn(
                            'text-[10px] font-bold shadow-xs border-none flex items-center gap-1',
                            !statusInfo.isLive
                              ? 'bg-slate-900/90 text-slate-300'
                              : statusInfo.urgency === 'critical'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : statusInfo.urgency === 'urgent'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.isLive ? 'bg-white' : 'bg-slate-400')} />
                          {statusInfo.daysLeftText}
                        </Badge>
                      </div>

                      {/* Club Name Overlay */}
                      {event.club && (
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white">
                          {event.club.logo_url ? (
                            <img
                              src={event.club.logo_url}
                              alt={event.club.name}
                              className="w-6 h-6 rounded-md object-cover bg-white shrink-0 border border-white/40"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur text-white flex items-center justify-center font-bold text-[10px] shrink-0 border border-white/40">
                              {event.club.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-semibold drop-shadow-sm truncate">{event.club.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                      </div>

                      {/* Meta Information: Date, Venue, College */}
                      <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{eventDate}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.venue || event.location || 'Campus Auditorium'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-600 font-semibold truncate pt-0.5">
                          <GraduationCap className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{collegeName}</span>
                        </div>
                      </div>

                      {/* Registered Attendees Stack */}
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                        {attendees.users.length > 0 ? (
                          <>
                            <div className="flex -space-x-1 overflow-hidden shrink-0">
                              {attendees.users.map((student, idx) => (
                                <div
                                  key={student.id || idx}
                                  title={student.name}
                                  className={cn(
                                    'inline-flex h-6 w-6 rounded-full ring-2 ring-white items-center justify-center text-[9px] font-bold text-white shadow-2xs select-none shrink-0',
                                    avatarColors[idx % avatarColors.length]
                                  )}
                                >
                                  {student.initials}
                                </div>
                              ))}
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">
                              {attendees.totalCount > attendees.users.length
                                ? `+${attendees.totalCount} registered`
                                : `${attendees.totalCount} registered`}
                            </span>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>{statusInfo.isLive ? 'Be the first to register' : 'Event completed'}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Footer with Pixel-Aligned Badges */}
                  <div className="px-4 py-3.5 flex items-center justify-between gap-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {event.entry_fee === 0 ? (
                        <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 leading-none">
                          Free
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 leading-none">
                          ₹{event.entry_fee}
                        </span>
                      )}

                      {event.prize_pool && Number(event.prize_pool) > 0 && (
                        <span className="inline-flex items-center justify-center gap-1 h-6 px-2.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 leading-none">
                          <Trophy className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>₹{Number(event.prize_pool).toLocaleString()}</span>
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform leading-none">
                      {statusInfo.isLive ? 'Register' : 'Details'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const attendees = eventAttendees[event.id] || { users: [], totalCount: 0 };
            const statusInfo = getEventStatusInfo(event);
            const collegeName = event.college || event.club?.college || 'DKTE Society\'s TEI';

            return (
              <Link key={event.id} href={`/dashboard/student/events/${event.id}`} className="block group">
                <Card className={cn(
                  "rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all duration-200 p-4 sm:p-5",
                  statusInfo.isLive ? "border-slate-200/80 hover:border-indigo-200" : "border-slate-200/50 opacity-85"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Image Thumbnail */}
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                        <img
                          src={event.image_url || '/placeholder.svg'}
                          alt={event.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Live / Days left badge */}
                          <Badge
                            className={cn(
                              'text-[10px] font-bold h-5.5 px-2 rounded-md leading-none inline-flex items-center',
                              !statusInfo.isLive
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : statusInfo.urgency === 'critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : statusInfo.urgency === 'urgent'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            )}
                          >
                            {statusInfo.daysLeftText}
                          </Badge>

                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-semibold capitalize h-5.5 px-2 rounded-md leading-none inline-flex items-center">
                            {event.mode || 'offline'}
                          </Badge>

                          {/* Aligned Fee & Prize badges */}
                          {event.entry_fee === 0 ? (
                            <span className="inline-flex items-center justify-center h-5.5 px-2 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 leading-none">
                              Free
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-5.5 px-2 rounded-md text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200/80 leading-none">
                              ₹{event.entry_fee}
                            </span>
                          )}

                          {event.prize_pool && Number(event.prize_pool) > 0 && (
                            <span className="inline-flex items-center justify-center gap-1 h-5.5 px-2 rounded-md text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 leading-none">
                              <Trophy className="h-3 w-3 text-amber-600" />
                              <span>₹{Number(event.prize_pool).toLocaleString()}</span>
                            </span>
                          )}

                          {event.club && (
                            <span className="text-xs text-slate-500 font-medium truncate">• {event.club.name}</span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors truncate">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {eventDate}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {event.venue || event.location || 'Campus Auditorium'}
                          </span>
                          <span className="flex items-center gap-1 text-indigo-600 font-semibold truncate">
                            <GraduationCap className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            {collegeName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Attendees & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Attendees */}
                      <div className="flex items-center gap-2">
                        {attendees.users.length > 0 && (
                          <div className="flex -space-x-1 overflow-hidden shrink-0">
                            {attendees.users.map((student, idx) => (
                              <div
                                key={student.id || idx}
                                title={student.name}
                                className={cn(
                                  'inline-flex h-6 w-6 rounded-full ring-2 ring-white items-center justify-center text-[9px] font-bold text-white shadow-xs select-none shrink-0',
                                  avatarColors[idx % avatarColors.length]
                                )}
                              >
                                {student.initials}
                              </div>
                            ))}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-600">
                          {attendees.totalCount} joined
                        </span>
                      </div>

                      <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-xs">
                        {statusInfo.isLive ? 'View & Register' : 'View Archive'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


