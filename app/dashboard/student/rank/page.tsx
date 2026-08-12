'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy,
  Star,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Building2,
  Sparkles,
  MapPin,
  Loader2,
  Search,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function RankLeaderboardPage() {
  const { user } = useAuth();
  const [userCollege, setUserCollege] = useState('');
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<any[]>([]);
  const [scope, setScope] = useState<'same' | 'inter' | 'global'>('same');
  const [category, setCategory] = useState<string>('all');
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCollegeSearchQuery('');
  }, [scope]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        if (user) {
          // Fetch student college
          const { data: dbUser } = await supabase
            .from('users')
            .select('college')
            .eq('id', user.id)
            .single();
          if (dbUser) {
            setUserCollege(dbUser.college);
          }
        }

        // Fetch verified clubs
        const { data: dbClubs, error: clubsErr } = await supabase
          .from('clubs')
          .select('*')
          .eq('is_verified', true);

        if (clubsErr) throw clubsErr;

        // Fetch club memberships to calculate member counts
        const { data: memberships } = await supabase
          .from('club_memberships')
          .select('club_id, role');

        // Fetch events for calculating stats
        const { data: events } = await supabase
          .from('events')
          .select('id, club_id, prize_pool, status, current_participants, entry_fee');

        // Fetch event registrations for turnouts
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id, status');

        // Grouping logic for scores calculation
        const clubMembersMap: Record<string, number> = {};
        memberships?.forEach((m) => {
          clubMembersMap[m.club_id] = (clubMembersMap[m.club_id] || 0) + 1;
        });

        const eventRegsMap: Record<string, number> = {};
        const eventAttendanceMap: Record<string, number> = {};
        registrations?.forEach((r) => {
          eventRegsMap[r.event_id] = (eventRegsMap[r.event_id] || 0) + 1;
          if (r.status === 'attended') {
            eventAttendanceMap[r.event_id] = (eventAttendanceMap[r.event_id] || 0) + 1;
          }
        });

        const scoredClubs = (dbClubs || []).map((club: any) => {
          const membersCount = clubMembersMap[club.id] || 0;
          const clubEvents = events?.filter((e) => e.club_id === club.id) || [];
          const completedEvents = clubEvents.filter(
            (e) => e.status === 'completed' || e.status === 'published'
          ).length;

          let registrationPoints = 0;
          let attendancePoints = 0;
          let prizePoolPoints = 0;
          let totalPrizePool = 0;

          clubEvents.forEach((e) => {
            const regs = eventRegsMap[e.id] || 0;
            const atts = eventAttendanceMap[e.id] || 0;
            registrationPoints += regs * 5;
            attendancePoints += atts * 15;

            const prize = Number(e.prize_pool) || 0;
            totalPrizePool += prize;
            prizePoolPoints += Math.floor(prize / 100);
          });

          const memberPoints = membersCount * 10;
          const eventPoints = completedEvents * 50;
          const verificationPoints = club.is_verified ? 200 : 0;

          const totalScore =
            memberPoints +
            eventPoints +
            registrationPoints +
            attendancePoints +
            prizePoolPoints +
            verificationPoints;

          const isSameCollege = club.college?.toLowerCase() === userCollege.toLowerCase();

          return {
            ...club,
            membersCount,
            completedEvents,
            totalPrizePool,
            isSameCollege,
            scoreBreakdown: {
              memberPoints,
              eventPoints,
              turnoutPoints: registrationPoints + attendancePoints,
              prizePoints: prizePoolPoints,
              verificationPoints,
            },
            totalScore,
          };
        });

        // Initial sort by total score descending
        const sorted = scoredClubs.sort((a, b) => b.totalScore - a.totalScore);
        setClubs(sorted);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [user, userCollege]);

  // Apply filters
  const filteredClubs = clubs
    .filter((club) => {
      // 1. Scope Filter
      if (scope === 'same') {
        return club.isSameCollege;
      }
      if (scope === 'inter') {
        if (club.isSameCollege) return false;
        if (collegeSearchQuery) {
          return club.college?.toLowerCase().includes(collegeSearchQuery.toLowerCase());
        }
        return !club.isSameCollege;
      }
      return true;
    })
    .filter((club) => {
      // 2. Category Filter
      if (category === 'all') return true;
      return club.category?.toLowerCase() === category.toLowerCase();
    })
    .filter((club) => {
      // 3. Search query
      if (!searchQuery) return true;
      return (
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.college.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Podium Winners (Top 3 of filtered list)
  const podiumClubs = filteredClubs.slice(0, 3);
  const remainingClubs = filteredClubs.slice(3);

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-8 py-6 space-y-10">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-900">Clunite Rankings</h1>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-semibold border-amber-200">
              <Trophy className="h-4.5 w-4.5 mr-1" /> Live Leaderboard
            </Badge>
          </div>
          <p className="text-gray-600 mt-2 font-medium">
            Find the highest-performing clubs based on live event turnouts, memberships, and prize pools.
          </p>
        </div>
        <Link href="/dashboard/student">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-[350px] items-center justify-center bg-white rounded-2xl border border-black/5">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-500 font-semibold">Calculating points and ranking clubs...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Podium Highlights */}
          {podiumClubs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
              {/* 2nd Place */}
              {podiumClubs[1] && (
                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-t from-slate-100 to-white relative order-2 md:order-1 md:h-[320px]">
                  <div className="absolute top-4 left-4 bg-slate-200 text-slate-800 h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-lg shadow-inner">
                    2
                  </div>
                  <CardContent className="p-6 text-center space-y-4 pt-10">
                    {podiumClubs[1].logo_url ? (
                      <img src={podiumClubs[1].logo_url} className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-slate-200 shadow-md" alt="Silver Logo" />
                    ) : (
                      <div className="w-20 h-20 rounded-full mx-auto bg-slate-300 text-white font-bold text-3xl flex items-center justify-center border-4 border-slate-200 shadow-md">
                        {podiumClubs[1].name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 truncate">{podiumClubs[1].name}</h3>
                      <p className="text-xs text-gray-500 font-semibold truncate">{podiumClubs[1].college}</p>
                    </div>
                    <Badge className="bg-slate-200 text-slate-800 text-sm font-bold px-3 py-1 rounded-full">
                      {podiumClubs[1].totalScore} pts
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* 1st Place */}
              {podiumClubs[0] && (
                <Card className="border-2 border-amber-300 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-t from-amber-50/40 to-white relative order-1 md:order-2 md:h-[360px] transform md:-translate-y-4">
                  <div className="absolute top-4 left-4 bg-amber-400 text-white h-10 w-10 rounded-full flex items-center justify-center font-black text-xl shadow-md">
                    1
                  </div>
                  <CardContent className="p-6 text-center space-y-4 pt-12">
                    {podiumClubs[0].logo_url ? (
                      <img src={podiumClubs[0].logo_url} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-amber-300 shadow-lg animate-pulse" alt="Gold Logo" />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-tr from-amber-400 to-yellow-500 text-white font-bold text-4xl flex items-center justify-center border-4 border-amber-300 shadow-lg">
                        {podiumClubs[0].name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 truncate">{podiumClubs[0].name}</h3>
                      <p className="text-xs text-amber-700 font-bold truncate flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3" /> {podiumClubs[0].college}
                      </p>
                    </div>
                    <Badge className="bg-amber-400 text-white text-base font-black px-4 py-1.5 rounded-full shadow-sm">
                      {podiumClubs[0].totalScore} pts
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* 3rd Place */}
              {podiumClubs[2] && (
                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-t from-amber-100/20 to-white relative order-3 md:h-[290px]">
                  <div className="absolute top-4 left-4 bg-amber-600/20 text-amber-800 h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-base shadow-inner">
                    3
                  </div>
                  <CardContent className="p-6 text-center space-y-4 pt-8">
                    {podiumClubs[2].logo_url ? (
                      <img src={podiumClubs[2].logo_url} className="w-16 h-16 rounded-full mx-auto object-cover border-4 border-amber-600/30 shadow-md" alt="Bronze Logo" />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto bg-amber-700/20 text-amber-800 font-bold text-2xl flex items-center justify-center border-4 border-amber-600/30 shadow-md">
                        {podiumClubs[2].name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 truncate">{podiumClubs[2].name}</h3>
                      <p className="text-xs text-gray-500 font-semibold truncate">{podiumClubs[2].college}</p>
                    </div>
                    <Badge className="bg-amber-700/20 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {podiumClubs[2].totalScore} pts
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Scope selectors */}
              <div className="flex bg-[#f5f5f7] p-1 rounded-xl w-fit">
                <button
                  onClick={() => setScope('same')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    scope === 'same'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-950'
                  }`}
                >
                  My College Only
                </button>
                <button
                  onClick={() => setScope('inter')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    scope === 'inter'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-950'
                  }`}
                >
                  Intercollege
                </button>
                <button
                  onClick={() => setScope('global')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    scope === 'global'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-950'
                  }`}
                >
                  Global
                </button>
              </div>

              {/* Category selector & Search bar */}
              <div className="flex items-center gap-3 flex-1 md:max-w-md justify-end">

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Social Work">Social Work</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clubs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rankings Table */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            {scope === 'inter' && (
              <div className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Intercollege Rankings</h3>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">Filter by college to compare performance indexes.</p>
                </div>
                <div className="relative w-full max-w-[280px]">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search college name..."
                    value={collegeSearchQuery}
                    onChange={(e) => setCollegeSearchQuery(e.target.value)}
                    className="pl-9 bg-white border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}
            {filteredClubs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground font-semibold">
                No clubs match the chosen filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-gray-500 font-bold text-xs uppercase tracking-wider border-b">
                      <th className="py-4 px-6">Rank</th>
                      <th className="py-4 px-6">Club Name</th>
                      <th className="py-4 px-6">Domain</th>
                      <th className="py-4 px-6 text-center">Events</th>
                      <th className="py-4 px-6 text-center">Members</th>
                      <th className="py-4 px-6 text-center">Points Breakdown</th>
                      <th className="py-4 px-6 text-right">Total Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClubs.map((club, index) => {
                      const displayRank = index + 1;
                      return (
                        <tr key={club.id} className="border-b hover:bg-slate-50/40 transition">
                          <td className="py-4 px-6 font-bold text-gray-900">
                            {displayRank === 1 ? '🥇' : displayRank === 2 ? '🥈' : displayRank === 3 ? '🥉' : `#${displayRank}`}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {club.logo_url ? (
                                <img src={club.logo_url} className="w-9 h-9 rounded-full object-cover border" alt="Logo" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-indigo-600">
                                  {club.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900">{club.name}</p>
                                <p className="text-xs text-gray-400 font-semibold">{club.college}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                              {club.category}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-center font-semibold text-gray-700">
                            {club.completedEvents}
                          </td>
                          <td className="py-4 px-6 text-center font-semibold text-gray-700">
                            {club.membersCount}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-3 text-xs">
                              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-semibold" title="Member Points">
                                👥 {club.scoreBreakdown.memberPoints}
                              </span>
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-semibold" title="Event Points">
                                📅 {club.scoreBreakdown.eventPoints}
                              </span>
                              <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-md font-semibold" title="Turnout Turnout Points">
                                👥 {club.scoreBreakdown.turnoutPoints}
                              </span>
                              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-semibold" title="Prize points">
                                🏆 {club.scoreBreakdown.prizePoints}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-black text-slate-900 text-lg">
                            {club.totalScore}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
