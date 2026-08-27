'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Building2,
  Clock,
  ArrowLeft,
  ChevronRight,
  Check,
  ExternalLink,
  MapPin,
  Compass,
  UserCheck,
  Layers,
  X,
  School,
  Globe,
  Eye,
  Info,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClubs, useUserClubs, joinClubInstant, leaveClubInstant } from '@/hooks/useClubs';
import { useEventsForClubIds } from '@/hooks/useEvents';
import { useAuth } from '@/lib/auth-context';
import { CollegeAutocomplete } from '@/components/college-autocomplete';
import { supabase } from '@/lib/supabase';
import { normalizeCollegeName } from '@/app/dashboard/student/rank/page';
import { toast } from 'sonner';

export default function MyClubsPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const userId = authUser?.id;

  const [userCollege, setUserCollege] = useState('');
  const [userNormCollege, setUserNormCollege] = useState('');

  // Supabase hooks for all clubs & user clubs
  const { clubs: allClubs, loading: allClubsLoading, refetch: refetchAllClubs } = useClubs();
  const { clubs: userClubs, loading: userClubsLoading, refetch: refetchUserClubs } = useUserClubs(userId || '');

  // Tab State: 'joined' | 'by-college' | 'all'
  const [activeTab, setActiveTab] = useState<'joined' | 'by-college' | 'all'>('joined');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);
  const [leavingClub, setLeavingClub] = useState<any | null>(null);

  // Quick Preview Modal State
  const [previewClub, setPreviewClub] = useState<any | null>(null);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const joinedClubIds = useMemo(() => userClubs.map((c) => c.id), [userClubs]);

  // Fetch events for joined clubs
  const { events: joinedClubsEvents } = useEventsForClubIds(joinedClubIds);

  // Fetch student college from DB
  useEffect(() => {
    async function loadUserCollege() {
      if (authUser) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('college')
          .eq('id', authUser.id)
          .single();
        if (dbUser && dbUser.college) {
          setUserCollege(dbUser.college);
          const norm = normalizeCollegeName(dbUser.college) || dbUser.college;
          setUserNormCollege(norm);
          // Set default selected college to user's college
          setSelectedCollege(norm);
        }
      }
    }
    loadUserCollege();
  }, [authUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, authLoading, router]);

  // Filtered joined clubs
  const filteredUserClubs = useMemo(() => {
    return userClubs.filter((club) => {
      const matchesCategory =
        categoryFilter === 'all' || club.category?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch =
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        club.category?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [userClubs, searchTerm, categoryFilter]);

  // Filtered clubs by selected college
  const clubsBySelectedCollege = useMemo(() => {
    if (!selectedCollege.trim()) return allClubs;

    const query = selectedCollege.toLowerCase().trim();
    return allClubs.filter((club) => {
      const rawCol = (club.college || '').toLowerCase();
      const normCol = (normalizeCollegeName(club.college) || club.college || '').toLowerCase();
      const matchesCollege = rawCol.includes(query) || normCol.includes(query);
      const matchesCategory =
        categoryFilter === 'all' || club.category?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        club.category?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCollege && matchesCategory && matchesSearch;
    });
  }, [allClubs, selectedCollege, searchTerm, categoryFilter]);

  // Filtered all clubs
  const filteredAllClubs = useMemo(() => {
    return allClubs.filter((club) => {
      const matchesCategory =
        categoryFilter === 'all' || club.category?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch =
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (club.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (club.college?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        club.category?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allClubs, searchTerm, categoryFilter]);

  // Load preview club events
  const handleOpenPreview = async (club: any) => {
    setPreviewClub(club);
    setPreviewLoading(true);
    try {
      const { data: clubEvents } = await supabase
        .from('events')
        .select('*')
        .eq('club_id', club.id)
        .order('start_date', { ascending: true });
      setPreviewEvents(clubEvents || []);
    } catch (err) {
      console.error('Error fetching preview events:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Real join handler
  const handleJoin = async (clubId: string, clubName: string) => {
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      setJoiningClubId(clubId);
      await joinClubInstant(userId, clubId);
      await Promise.all([refetchUserClubs(), refetchAllClubs()]);
      toast.success(`Welcome to ${clubName}! You are now an active member.`);
    } catch (error) {
      console.error('Error joining club:', error);
      toast.error('Failed to join club. Please try again.');
    } finally {
      setJoiningClubId(null);
    }
  };

  // Real leave handler
  const confirmLeave = async () => {
    if (!userId || !leavingClub) return;

    try {
      await leaveClubInstant(userId, leavingClub.id);
      await Promise.all([refetchUserClubs(), refetchAllClubs()]);
      toast.info(`Left ${leavingClub.name}`);
      setLeavingClub(null);
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.error('Failed to leave club. Please try again.');
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('tech') || cat.includes('coding')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (cat.includes('cultur') || cat.includes('art')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat.includes('entre') || cat.includes('ecell') || cat.includes('business')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (cat.includes('sport') || cat.includes('game')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  // Loading state
  if (authLoading || (allClubsLoading && userClubs.length === 0 && allClubs.length === 0) || userClubsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium text-xs">Loading campus communities...</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6 sm:space-y-8 antialiased">
      {/* ================= HERO HEADER ================= */}
      <div className="relative rounded-2xl bg-white border border-black/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/60 via-purple-100/30 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Campus Clubs & Communities
            </h1>
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold text-xs">
              {userClubs.length} Joined
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Explore clubs by college, discover upcoming student events, and manage your memberships.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <Link href="/dashboard/student/my-clubs/discover">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-semibold h-9 shadow-sm flex items-center gap-1.5">
              <Compass className="h-4 w-4" />
              <span>Smart Matchmaker</span>
            </Button>
          </Link>
          <Link href="/dashboard/student">
            <Button variant="ghost" className="rounded-xl text-xs font-semibold h-9 text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= TABS NAVIGATION ================= */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <TabsList className="bg-white border border-black/5 p-1 rounded-2xl h-auto shadow-sm">
            <TabsTrigger
              value="joined"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>My Joined Clubs ({userClubs.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="by-college"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-2"
            >
              <School className="h-4 w-4" />
              <span>Explore by College</span>
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              <span>All Campus Clubs ({allClubs.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =========================================================================
            TAB 1: JOINED CLUBS
           ========================================================================= */}
        <TabsContent value="joined" className="space-y-6">
          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Active Memberships</p>
                  <p className="text-2xl font-black text-slate-900">{userClubs.length}</p>
                  <span className="text-[11px] text-indigo-600 font-medium">Joined Organizations</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Upcoming Club Events</p>
                  <p className="text-2xl font-black text-slate-900">{joinedClubsEvents?.length || 0}</p>
                  <span className="text-[11px] text-emerald-600 font-medium">From Your Clubs</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Explore Other Colleges</p>
                  <p className="text-2xl font-black text-slate-900">{allClubs.length}</p>
                  <button
                    onClick={() => setActiveTab('by-college')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    Browse Campuses →
                  </button>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <School className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Joined Clubs List */}
          {filteredUserClubs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {userClubs.length === 0 ? 'You haven’t joined any clubs yet' : 'No clubs match your filter'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Search any college or browse all campus clubs to join student organizations and register for events.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('by-college')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <School className="h-4 w-4 mr-1.5" /> Search & Explore by College
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUserClubs.map((club) => (
                <Card
                  key={club.id}
                  className="border border-black/5 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-20 bg-gradient-to-r from-indigo-100/80 via-purple-50/60 to-slate-100 p-4 flex items-start justify-between relative">
                      <Badge
                        className={`${getCategoryBadgeClass(
                          club.category
                        )} text-[10px] font-semibold border shadow-none capitalize`}
                      >
                        {club.category || 'General'}
                      </Badge>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold flex items-center gap-1 shadow-none">
                        <Check className="h-3 w-3" /> Member
                      </Badge>
                    </div>

                    <div className="p-5 pt-0 relative">
                      <div className="-mt-8 mb-3 inline-block">
                        {club.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center border-2 border-white shadow-md">
                            {club.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors truncate">
                            {club.name}
                          </h3>
                          {club.is_verified && (
                            <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {club.description || 'Active campus student community fostering innovation and collaboration.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-4 mt-4 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {club.members_count || 1} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {club.events_hosted_count || 0} events
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setLeavingClub(club)}
                      className="text-slate-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                    >
                      Leave
                    </button>
                    <Link href={`/dashboard/student/my-clubs/${club.id}`}>
                      <Button
                        size="sm"
                        className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1"
                      >
                        <span>Enter Hub</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 2: EXPLORE BY COLLEGE (REQUESTED FEATURE)
           ========================================================================= */}
        <TabsContent value="by-college" className="space-y-6">
          {/* Dedicated College Search Header */}
          <Card className="border border-black/5 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <School className="h-4 w-4 text-indigo-600" />
                    Search Any College & Explore Its Clubs
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Select any university to view all of its student organizations, events, and activities.
                  </CardDescription>
                </div>
                {userNormCollege && (
                  <button
                    onClick={() => setSelectedCollege(userNormCollege)}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>Switch to My College ({userNormCollege.split(' ')[0]})</span>
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* College Autocomplete Input */}
                <div className="relative flex-1 w-full">
                  <CollegeAutocomplete
                    placeholder="Search and select college (e.g. DKTE, Walchand, COEP, MIT-WPU)..."
                    value={selectedCollege}
                    onChange={(val) => setSelectedCollege(val)}
                    allowPartialOnBlur={true}
                    className="h-10 text-xs bg-slate-50/70 border-slate-200 focus:bg-white"
                    rightIcon={
                      selectedCollege ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCollege('');
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : undefined
                    }
                  />
                </div>

                {/* Search Term Input inside selected college */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9 h-10 text-xs bg-slate-50/70 border-slate-200 focus:bg-white"
                    placeholder="Filter clubs by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['all', 'technical', 'cultural', 'entrepreneurship', 'sports', 'social'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Campus Status Badge */}
          {selectedCollege && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{selectedCollege}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Showing {clubsBySelectedCollege.length} student {clubsBySelectedCollege.length === 1 ? 'organization' : 'organizations'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCollege('')}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Clear Filter
              </Button>
            </div>
          )}

          {/* Clubs Grid for Selected College */}
          {clubsBySelectedCollege.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center space-y-3 shadow-sm">
              <Building2 className="h-8 w-8 text-indigo-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {selectedCollege ? `No Clubs Found for ${selectedCollege}` : 'No Clubs Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {selectedCollege
                  ? 'No registered clubs were found for this campus. Try searching another university or view all clubs.'
                  : 'Select a college from the search bar above to explore its clubs.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clubsBySelectedCollege.map((club) => {
                const isMemberOfThisClub = userClubs.some((c) => c.id === club.id);
                return (
                  <Card
                    key={club.id}
                    className="border border-black/5 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="h-16 bg-gradient-to-r from-indigo-100/70 via-purple-50/50 to-slate-100 p-4 flex items-start justify-between">
                        <Badge
                          className={`${getCategoryBadgeClass(
                            club.category
                          )} text-[10px] font-semibold border shadow-none capitalize`}
                        >
                          {club.category || 'General'}
                        </Badge>
                        {isMemberOfThisClub ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold flex items-center gap-1 shadow-none">
                            <Check className="h-3 w-3" /> Joined
                          </Badge>
                        ) : (
                          <Badge className="bg-white text-slate-700 border-slate-200 text-[10px] font-semibold shadow-sm flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{club.credibility_score ? Number(club.credibility_score).toFixed(1) : '9.4'}</span>
                          </Badge>
                        )}
                      </div>

                      {/* Info Content */}
                      <div className="p-5 pt-0">
                        <div className="-mt-7 mb-3 inline-block">
                          {club.logo_url ? (
                            <img
                              src={club.logo_url}
                              alt={club.name}
                              className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                            />
                          ) : (
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center border-2 border-white shadow-md">
                              {club.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors truncate">
                              {club.name}
                            </h3>
                            {club.is_verified && (
                              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {club.description || 'Active campus student society fostering collaboration and growth.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-4 mt-4 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {club.members_count || 0} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {club.events_hosted_count || 0} events
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenPreview(club)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 h-8"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Quick Events</span>
                      </Button>

                      <Link href={`/dashboard/student/my-clubs/${club.id}`}>
                        <Button
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 h-8"
                        >
                          <span>Explore Club</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            TAB 3: ALL CAMPUS CLUBS
           ========================================================================= */}
        <TabsContent value="all" className="space-y-6">
          <Card className="border border-black/5 shadow-sm rounded-2xl">
            <CardContent className="p-4 sm:p-5 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-200"
                  placeholder="Search across all universities and clubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'technical', 'cultural', 'entrepreneurship', 'sports', 'social'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAllClubs.map((club) => {
              const isMember = userClubs.some((c) => c.id === club.id);
              return (
                <Card
                  key={club.id}
                  className="border border-black/5 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-16 bg-gradient-to-r from-slate-100 via-slate-50 to-indigo-50/40 p-4 flex items-start justify-between">
                      <Badge
                        className={`${getCategoryBadgeClass(
                          club.category
                        )} text-[10px] font-semibold border shadow-none capitalize`}
                      >
                        {club.category || 'General'}
                      </Badge>
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                        {club.college}
                      </span>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="-mt-7 mb-3 inline-block">
                        {club.logo_url ? (
                          <img
                            src={club.logo_url}
                            alt={club.name}
                            className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-2xl bg-slate-800 text-white font-extrabold text-lg flex items-center justify-center border-2 border-white shadow-md">
                            {club.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors truncate">
                            {club.name}
                          </h3>
                          {club.is_verified && (
                            <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {club.description || 'Campus student community fostering collaborative projects and events.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-4 mt-4 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {club.members_count || 0} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {club.events_hosted_count || 0} events
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenPreview(club)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 h-8"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Events Preview</span>
                    </Button>

                    <Link href={`/dashboard/student/my-clubs/${club.id}`}>
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 h-8"
                      >
                        <span>Explore</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ================= MODAL: QUICK CLUB EVENTS & DETAILS PREVIEW ================= */}
      <Dialog open={!!previewClub} onOpenChange={() => setPreviewClub(null)}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-xl max-h-[85vh] overflow-y-auto">
          {previewClub && (
            <div className="space-y-5">
              <DialogHeader className="text-left space-y-2">
                <div className="flex items-center gap-3">
                  {previewClub.logo_url ? (
                    <img
                      src={previewClub.logo_url}
                      alt={previewClub.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold text-xl flex items-center justify-center border border-indigo-100">
                      {previewClub.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {previewClub.name}
                      {previewClub.is_verified && <ShieldCheck className="h-4 w-4 text-indigo-600" />}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 font-medium">{previewClub.college}</p>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold mt-1 capitalize">
                      {previewClub.category}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {previewClub.description || 'Active campus student organization.'}
              </p>

              {/* Events Section inside Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    Events by {previewClub.name} ({previewEvents.length})
                  </h4>
                </div>

                {previewLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                ) : previewEvents.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <Calendar className="h-6 w-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">No events currently scheduled</p>
                    <p className="text-[11px] text-slate-400">Check back soon for new workshops and competitions.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {previewEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 transition-colors border border-slate-200/70 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{evt.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span>{new Date(evt.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span className="capitalize">{evt.mode || 'offline'}</span>
                            {evt.entry_fee === 0 ? (
                              <span className="text-emerald-600 font-bold">Free</span>
                            ) : (
                              <span className="text-slate-700 font-bold">₹{evt.entry_fee}</span>
                            )}
                          </div>
                        </div>

                        <Link href={`/dashboard/student/events/${evt.id}`}>
                          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs h-7 px-2.5">
                            Register
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewClub(null)}
                  className="rounded-xl text-xs"
                >
                  Close
                </Button>
                <Link href={`/dashboard/student/my-clubs/${previewClub.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                    <span>Full Club Hub</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= CONFIRM LEAVE MODAL ================= */}
      <Dialog open={!!leavingClub} onOpenChange={() => setLeavingClub(null)}>
        <DialogContent className="max-w-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-xl">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-base font-bold text-slate-900">
              Leave {leavingClub?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              You will lose access to member notices, internal events, and shared resources for this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeavingClub(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmLeave}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
            >
              Confirm & Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
