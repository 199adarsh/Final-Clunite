'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trophy,
  Building2,
  Loader2,
  Search,
  ArrowLeft,
  Share2,
  Info,
  GraduationCap,
  Zap,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CollegeAutocomplete } from '@/components/college-autocomplete';
import { COLLEGES } from '@/lib/colleges';
import { useAuth } from '@/lib/auth-context';
import { ALL_BRANCHES } from '@/lib/branches';
import { toast } from 'sonner';

/* ---------------- TIER LEVEL HELPERS ---------------- */
export interface TierInfo {
  name: string;
  minXp: number;
  maxXp: number;
  badgeStyle: string;
}

export const TIERS: TierInfo[] = [
  {
    name: 'Explorer',
    minXp: 0,
    maxXp: 100,
    badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    name: 'Contender',
    minXp: 101,
    maxXp: 300,
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    name: 'Achiever',
    minXp: 301,
    maxXp: 600,
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    name: 'Innovator',
    minXp: 601,
    maxXp: 1200,
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    name: 'Champion',
    minXp: 1201,
    maxXp: 999999,
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

export function getTier(xp: number): TierInfo {
  return TIERS.find((t) => xp >= t.minXp && xp <= t.maxXp) || TIERS[0];
}

export function getNextTier(xp: number): { nextTier: TierInfo | null; progressPercent: number; remainingXp: number } {
  const currentTierIndex = TIERS.findIndex((t) => xp >= t.minXp && xp <= t.maxXp);
  if (currentTierIndex === -1 || currentTierIndex === TIERS.length - 1) {
    return { nextTier: null, progressPercent: 100, remainingXp: 0 };
  }
  const currentTier = TIERS[currentTierIndex];
  const nextTier = TIERS[currentTierIndex + 1];
  const range = nextTier.minXp - currentTier.minXp;
  const progressInTier = Math.max(0, xp - currentTier.minXp);
  const progressPercent = Math.min(100, Math.round((progressInTier / range) * 100));
  const remainingXp = Math.max(0, nextTier.minXp - xp);
  return { nextTier, progressPercent, remainingXp };
}

/* ---------------- NORMALIZATION HELPERS ---------------- */
export function normalizeCollegeName(rawName: string | null | undefined): string | null {
  if (!rawName) return null;
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  
  // Exclude invalid/dummy college names
  if (
    lower === 'unknown' ||
    lower === 'not specified' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'none' ||
    lower === 'your college' ||
    trimmed === ''
  ) {
    return null;
  }

  // Canonical normalization for DKTE variants
  if (lower.includes('dkte') || lower.includes('ichalkaranji') || lower.includes('dattajirao kadam')) {
    return "DKTE Society's Textile & Engineering Institute, Ichalkaranji";
  }

  // Check exact match in verified COLLEGES list
  const exactMatch = COLLEGES.find((c) => c.name.toLowerCase() === lower);
  if (exactMatch) return exactMatch.name;

  // Title case cleanup for all-uppercase or messy entries
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) {
    return trimmed
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return trimmed;
}

export function formatBranchName(rawBranch: string | null | undefined): string {
  if (!rawBranch) return 'General Engineering';
  const trimmed = rawBranch.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'aids' || lower === 'ai-ds' || lower === 'ai & ds') {
    return 'Artificial Intelligence & Data Science (AIDS)';
  }
  if (lower === 'aiml' || lower === 'ai-ml' || lower === 'ai & ml') {
    return 'CSE (AI & ML)';
  }
  if (lower === 'cse' || lower === 'computer science' || lower === 'cs' || lower === 'comps') {
    return 'Computer Science & Engineering';
  }
  if (lower === 'it' || lower === 'information technology') {
    return 'Information Technology';
  }
  if (lower === 'mech' || lower === 'mechanical') {
    return 'Mechanical Engineering';
  }
  if (lower === 'civil') {
    return 'Civil Engineering';
  }
  if (lower === 'ece' || lower === 'electronics') {
    return 'Electronics & Communication';
  }

  // Title-case single/multi-word branch
  return trimmed
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/* ---------------- INTERFACES ---------------- */
interface ScoredStudent {
  id: string;
  name: string;
  college: string;
  rawCollege: string;
  branch: string | null;
  displayBranch: string;
  gender: string | null;
  avatarUrl: string;
  totalXp: number;
  tier: TierInfo;
  isCurrentUser: boolean;
  isSameCollege: boolean;
  scoreBreakdown: {
    attendedCount: number;
    attendedPoints: number;
    certCount: number;
    certPoints: number;
    regCount: number;
    regPoints: number;
    memberCount: number;
    memberPoints: number;
  };
}

interface ScoredClub {
  id: string;
  name: string;
  college: string;
  rawCollege: string;
  category: string;
  logo_url: string | null;
  is_verified: boolean;
  membersCount: number;
  completedEvents: number;
  totalPrizePool: number;
  isSameCollege: boolean;
  totalScore: number;
  scoreBreakdown: {
    memberPoints: number;
    eventPoints: number;
    turnoutPoints: number;
    prizePoints: number;
    verificationPoints: number;
  };
}

interface ScoredCollege {
  collegeName: string;
  totalStudents: number;
  totalClubs: number;
  totalEvents: number;
  totalCertificates: number;
  totalPoints: number;
  isUserCollege: boolean;
}

export default function RankLeaderboardPage() {
  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [userCollege, setUserCollege] = useState('');
  const [userNormalizedCollege, setUserNormalizedCollege] = useState('');
  const [loading, setLoading] = useState(true);

  // Active track: 'students' | 'clubs' | 'colleges'
  const [activeTrack, setActiveTrack] = useState<'students' | 'clubs' | 'colleges'>('students');

  // Filters
  const [scope, setScope] = useState<'same' | 'all'>('same');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Scored datasets
  const [students, setStudents] = useState<ScoredStudent[]>([]);
  const [clubs, setClubs] = useState<ScoredClub[]>([]);
  const [colleges, setColleges] = useState<ScoredCollege[]>([]);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<ScoredStudent | null>(null);
  const [selectedClub, setSelectedClub] = useState<ScoredClub | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<ScoredCollege | null>(null);
  const [scoringGuideOpen, setScoringGuideOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadAllLeaderboards();
  }, [user]);

  async function loadAllLeaderboards() {
    try {
      setLoading(true);
      let studentCollege = '';
      let studentNormCollege = '';

      if (user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (dbUser) {
          setCurrentUserData(dbUser);
          studentCollege = dbUser.college || '';
          studentNormCollege = normalizeCollegeName(studentCollege) || studentCollege;
          setUserCollege(studentCollege);
          setUserNormalizedCollege(studentNormCollege);
        }
      }

      // Fetch required datasets in parallel
      const [
        { data: allUsers },
        { data: allClubs },
        { data: allRegistrations },
        { data: allCertificates },
        { data: allMemberships },
        { data: allEvents },
      ] = await Promise.all([
        supabase.from('users').select('id, full_name, college, branch, gender, avatar_url, role'),
        supabase.from('clubs').select('*'),
        supabase.from('event_registrations').select('id, user_id, event_id, status'),
        (supabase as any).from('issued_certificates').select('id, user_id, recipient_email'),
        supabase.from('club_memberships').select('id, user_id, club_id, role'),
        supabase.from('events').select('id, club_id, college, prize_pool, status, current_participants'),
      ]);

      /* 1. STUDENT LEADERBOARD */
      const userRegMap: Record<string, { total: number; attended: number }> = {};
      allRegistrations?.forEach((r) => {
        if (!userRegMap[r.user_id]) userRegMap[r.user_id] = { total: 0, attended: 0 };
        if (r.status !== 'cancelled') userRegMap[r.user_id].total += 1;
        if (r.status === 'attended') userRegMap[r.user_id].attended += 1;
      });

      const userCertMap: Record<string, number> = {};
      allCertificates?.forEach((c: any) => {
        if (c.user_id) {
          userCertMap[c.user_id] = (userCertMap[c.user_id] || 0) + 1;
        }
      });

      const userClubMemberMap: Record<string, number> = {};
      allMemberships?.forEach((m) => {
        userClubMemberMap[m.user_id] = (userClubMemberMap[m.user_id] || 0) + 1;
      });

      const scoredStudents: ScoredStudent[] = (allUsers || [])
        .filter((u) => u.role !== 'admin')
        .map((u) => {
          const regInfo = userRegMap[u.id] || { total: 0, attended: 0 };
          const certCount = userCertMap[u.id] || 0;
          const memberCount = userClubMemberMap[u.id] || 0;

          const regPoints = regInfo.total * 10;
          const attendedPoints = regInfo.attended * 30;
          const certPoints = certCount * 50;
          const memberPoints = memberCount * 15;
          const totalXp = regPoints + attendedPoints + certPoints + memberPoints;

          const tier = getTier(totalXp);
          const isCurrentUser = user ? u.id === user.id : false;
          
          const rawCol = u.college || '';
          const normCol = normalizeCollegeName(rawCol) || rawCol || 'Campus';
          
          const isSameCollege = studentNormCollege
            ? normCol.toLowerCase() === studentNormCollege.toLowerCase()
            : false;

          let avatarUrl = u.avatar_url;
          if (!avatarUrl) {
            avatarUrl = u.gender?.toLowerCase() === 'female' ? '/girl.png' : '/boy.png';
          }

          return {
            id: u.id,
            name: u.full_name || 'Student',
            college: normCol,
            rawCollege: rawCol,
            branch: u.branch || null,
            displayBranch: formatBranchName(u.branch),
            gender: u.gender || null,
            avatarUrl,
            totalXp,
            tier,
            isCurrentUser,
            isSameCollege,
            scoreBreakdown: {
              attendedCount: regInfo.attended,
              attendedPoints,
              certCount,
              certPoints,
              regCount: regInfo.total,
              regPoints,
              memberCount,
              memberPoints,
            },
          };
        })
        .sort((a, b) => b.totalXp - a.totalXp);

      setStudents(scoredStudents);

      /* 2. CLUB LEADERBOARD */
      const clubMembersCountMap: Record<string, number> = {};
      allMemberships?.forEach((m) => {
        clubMembersCountMap[m.club_id] = (clubMembersCountMap[m.club_id] || 0) + 1;
      });

      const eventRegsMap: Record<string, number> = {};
      const eventAttendanceMap: Record<string, number> = {};
      allRegistrations?.forEach((r) => {
        eventRegsMap[r.event_id] = (eventRegsMap[r.event_id] || 0) + 1;
        if (r.status === 'attended') {
          eventAttendanceMap[r.event_id] = (eventAttendanceMap[r.event_id] || 0) + 1;
        }
      });

      const scoredClubs: ScoredClub[] = (allClubs || [])
        .filter((club) => club.is_verified)
        .map((club) => {
          const membersCount = clubMembersCountMap[club.id] || 0;
          const clubEvents = allEvents?.filter((e) => e.club_id === club.id) || [];
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

          const rawCol = club.college || '';
          const normCol = normalizeCollegeName(rawCol) || rawCol || 'Campus';

          const isSameCollege = studentNormCollege
            ? normCol.toLowerCase() === studentNormCollege.toLowerCase()
            : false;

          return {
            id: club.id,
            name: club.name,
            college: normCol,
            rawCollege: rawCol,
            category: club.category || 'General',
            logo_url: club.logo_url,
            is_verified: club.is_verified,
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
        })
        .sort((a, b) => b.totalScore - a.totalScore);

      setClubs(scoredClubs);

      /* 3. COLLEGE STANDINGS (Normalized & Deduplicated) */
      const collegeStatsMap: Record<
        string,
        { students: number; clubs: number; events: number; certs: number; points: number }
      > = {};

      scoredStudents.forEach((st) => {
        const norm = normalizeCollegeName(st.rawCollege);
        if (!norm) return; // Filter out unknown/unspecified colleges
        if (!collegeStatsMap[norm]) {
          collegeStatsMap[norm] = { students: 0, clubs: 0, events: 0, certs: 0, points: 0 };
        }
        collegeStatsMap[norm].students += 1;
        collegeStatsMap[norm].certs += st.scoreBreakdown.certCount;
        collegeStatsMap[norm].points += st.totalXp;
      });

      scoredClubs.forEach((cl) => {
        const norm = normalizeCollegeName(cl.rawCollege);
        if (!norm) return;
        if (!collegeStatsMap[norm]) {
          collegeStatsMap[norm] = { students: 0, clubs: 0, events: 0, certs: 0, points: 0 };
        }
        collegeStatsMap[norm].clubs += 1;
        collegeStatsMap[norm].events += cl.completedEvents;
        collegeStatsMap[norm].points += cl.totalScore;
      });

      const scoredColleges: ScoredCollege[] = Object.entries(collegeStatsMap)
        .map(([collegeName, stats]) => ({
          collegeName,
          totalStudents: stats.students,
          totalClubs: stats.clubs,
          totalEvents: stats.events,
          totalCertificates: stats.certs,
          totalPoints: stats.points,
          isUserCollege: studentNormCollege
            ? collegeName.toLowerCase() === studentNormCollege.toLowerCase()
            : false,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);

      setColleges(scoredColleges);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  // Logged-in student standings
  const myStudentRankIndex = students.findIndex((s) => s.isCurrentUser);
  const currentStudent = myStudentRankIndex !== -1 ? students[myStudentRankIndex] : null;
  const myCollegeRankIndex = students
    .filter((s) => s.isSameCollege)
    .findIndex((s) => s.isCurrentUser);

  const { nextTier, progressPercent, remainingXp } = currentStudent
    ? getNextTier(currentStudent.totalXp)
    : { nextTier: null, progressPercent: 0, remainingXp: 0 };

  /* ---------------- FILTERING ---------------- */
  const filteredStudents = students
    .filter((st) => {
      if (scope === 'same') return st.isSameCollege;
      if (selectedCollegeFilter) {
        return st.college.toLowerCase().includes(selectedCollegeFilter.toLowerCase());
      }
      return true;
    })
    .filter((st) => {
      if (branchFilter === 'all') return true;
      return (
        st.branch?.toLowerCase().includes(branchFilter.toLowerCase()) ||
        st.displayBranch.toLowerCase().includes(branchFilter.toLowerCase())
      );
    })
    .filter((st) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.college.toLowerCase().includes(q) ||
        st.displayBranch.toLowerCase().includes(q)
      );
    });

  const filteredClubs = clubs
    .filter((cl) => {
      if (scope === 'same') return cl.isSameCollege;
      if (selectedCollegeFilter) {
        return cl.college.toLowerCase().includes(selectedCollegeFilter.toLowerCase());
      }
      return true;
    })
    .filter((cl) => {
      if (categoryFilter === 'all') return true;
      return cl.category.toLowerCase() === categoryFilter.toLowerCase();
    })
    .filter((cl) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return cl.name.toLowerCase().includes(q) || cl.college.toLowerCase().includes(q);
    });

  const filteredColleges = colleges.filter((col) => {
    if (!searchQuery) return true;
    return col.collegeName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCopyShare = () => {
    const rankText = myCollegeRankIndex !== -1 ? `#${myCollegeRankIndex + 1}` : 'Top';
    const text = `I'm ranked ${rankText} at ${userNormalizedCollege || userCollege || 'my college'} on Clunite with ${
      currentStudent?.totalXp || 0
    } XP! Track your campus events and rank on Clunite.`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success('Rank copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6 sm:space-y-8 antialiased">
      {/* ================= HERO HEADER ================= */}
      <div className="relative rounded-2xl bg-white border border-black/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm overflow-hidden">
        {/* Subtle decorative gradient matching browse events */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/60 via-purple-100/30 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Rankings & Leaderboard
            </h1>
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold text-xs">
              Live Standings
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Campus champions, active student clubs, and inter-college rankings
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => setScoringGuideOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold h-9 text-slate-700 hover:bg-slate-50"
          >
            <Info className="h-4 w-4 mr-1.5 text-indigo-600" />
            Scoring Rules
          </Button>
          <Link href="/dashboard/student">
            <Button variant="ghost" className="rounded-xl text-xs font-semibold h-9 text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= PERSONAL STANDING BANNER ================= */}
      {currentStudent && (
        <Card className="border border-black/5 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            {/* User Profile */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={currentStudent.avatarUrl}
                  alt={currentStudent.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm bg-slate-50"
                />
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                  #{myCollegeRankIndex !== -1 ? myCollegeRankIndex + 1 : '—'}
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                    {currentStudent.name}
                  </span>
                  <Badge className={`${currentStudent.tier.badgeStyle} text-xs font-semibold border shadow-none`}>
                    {currentStudent.tier.name}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {currentStudent.college} • {currentStudent.displayBranch}
                </p>
              </div>
            </div>

            {/* Progress to Next Tier */}
            <div className="flex-1 max-w-md space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-900 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600" />
                  {currentStudent.totalXp} XP Total
                </span>
                {nextTier ? (
                  <span className="text-slate-500 font-medium text-[11px]">
                    {remainingXp} XP to <strong className="text-slate-800 font-bold">{nextTier.name}</strong>
                  </span>
                ) : (
                  <span className="text-indigo-600 font-bold text-[11px]">Maximum Tier Reached</span>
                )}
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{currentStudent.scoreBreakdown.attendedCount} events attended</span>
                <span>{currentStudent.scoreBreakdown.certCount} certificates earned</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={() => setSelectedStudent(currentStudent)}
                className="rounded-xl border-slate-200 text-slate-700 font-semibold text-xs h-9 hover:bg-slate-50"
              >
                Breakdown
              </Button>
              <Button
                onClick={handleCopyShare}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-xs h-9 shadow-sm flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TABS & FILTER BAR ================= */}
      <Tabs
        value={activeTrack}
        onValueChange={(val: any) => setActiveTrack(val)}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <TabsList className="bg-white border border-black/5 p-1 rounded-2xl h-auto shadow-sm">
            <TabsTrigger
              value="students"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student MVPs</span>
            </TabsTrigger>
            <TabsTrigger
              value="clubs"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              <span>Top Clubs</span>
            </TabsTrigger>
            <TabsTrigger
              value="colleges"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              <span>College League</span>
            </TabsTrigger>
          </TabsList>

          {/* Scope selection for students and clubs */}
          {activeTrack !== 'colleges' && (
            <div className="flex items-center bg-white rounded-2xl border border-black/5 p-1 shadow-sm shrink-0">
              <button
                onClick={() => {
                  setScope('same');
                  setSelectedCollegeFilter('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scope === 'same'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My College ({userNormalizedCollege ? userNormalizedCollege.split(' ')[0] : 'Campus'})
              </button>
              <button
                onClick={() => setScope('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scope === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Colleges
              </button>
            </div>
          )}
        </div>

        {/* Filters Card */}
        <Card className="border border-black/5 shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5 flex flex-wrap items-center gap-3">
            {/* Search by Name */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-200"
                placeholder={
                  activeTrack === 'students'
                    ? 'Search student name...'
                    : activeTrack === 'clubs'
                    ? 'Search club name...'
                    : 'Search university or college...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* College Autocomplete Dropdown (All Colleges mode) */}
            {activeTrack !== 'colleges' && scope === 'all' && (
              <div className="relative w-full sm:w-80">
                <CollegeAutocomplete
                  placeholder="Filter by college..."
                  value={selectedCollegeFilter}
                  onChange={(val) => setSelectedCollegeFilter(val)}
                  allowPartialOnBlur={true}
                  className="h-9 text-xs bg-slate-50/50 border-slate-200"
                  rightIcon={
                    selectedCollegeFilter ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCollegeFilter('');
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : undefined
                  }
                />
              </div>
            )}

            {/* Branch Filter for students */}
            {activeTrack === 'students' && (
              <Select value={branchFilter} onValueChange={(val) => setBranchFilter(val)}>
                <SelectTrigger className="w-48 h-9 text-xs bg-slate-50/50 border-slate-200">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 max-h-60">
                  <SelectItem value="all" className="text-xs font-semibold">All Engineering Branches</SelectItem>
                  {ALL_BRANCHES.map((b) => (
                    <SelectItem key={b} value={b} className="text-xs">
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Category Filter for clubs */}
            {activeTrack === 'clubs' && (
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
                <SelectTrigger className="w-40 h-9 text-xs bg-slate-50/50 border-slate-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-xs font-semibold">All Categories</SelectItem>
                  <SelectItem value="technical" className="text-xs">Technical & Coding</SelectItem>
                  <SelectItem value="cultural" className="text-xs">Cultural & Arts</SelectItem>
                  <SelectItem value="entrepreneurship" className="text-xs">E-Cell & Business</SelectItem>
                  <SelectItem value="sports" className="text-xs">Sports & Gaming</SelectItem>
                  <SelectItem value="social" className="text-xs">Social & Community</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* =========================================================================
            TRACK 1: STUDENT MVPS
           ========================================================================= */}
        <TabsContent value="students" className="space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-black/5">
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Loading student rankings...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Students Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No participants match your active filters. Try searching with "All Colleges" selected.
              </p>
            </div>
          ) : (
            <>
              {/* TOP 3 PODIUM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-2">
                {/* 2nd Place */}
                {filteredStudents[1] && (
                  <Card
                    onClick={() => setSelectedStudent(filteredStudents[1])}
                    className="border border-slate-200/90 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer order-2 md:order-1 md:h-[300px] flex flex-col justify-between p-6 text-center group"
                  >
                    <div className="space-y-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mx-auto">
                        2
                      </div>
                      <img
                        src={filteredStudents[1].avatarUrl}
                        className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-slate-200 bg-slate-50 shadow-sm"
                        alt="Silver Student"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {filteredStudents[1].name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {filteredStudents[1].college}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {filteredStudents[1].displayBranch}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Badge className={`${filteredStudents[1].tier.badgeStyle} text-[10px] font-semibold border shadow-none`}>
                        {filteredStudents[1].tier.name}
                      </Badge>
                      <span className="font-extrabold text-xs text-slate-900">
                        {filteredStudents[1].totalXp} XP
                      </span>
                    </div>
                  </Card>
                )}

                {/* 1st Place */}
                {filteredStudents[0] && (
                  <Card
                    onClick={() => setSelectedStudent(filteredStudents[0])}
                    className="border-2 border-amber-300 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer order-1 md:order-2 md:h-[330px] flex flex-col justify-between p-6 text-center group transform md:-translate-y-2"
                  >
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-400 text-white font-black text-xs flex items-center justify-center mx-auto shadow-sm">
                        1
                      </div>
                      <img
                        src={filteredStudents[0].avatarUrl}
                        className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-amber-300 bg-slate-50 shadow-md"
                        alt="Gold Student"
                      />
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {filteredStudents[0].name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                          {filteredStudents[0].college}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {filteredStudents[0].displayBranch}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                        {filteredStudents[0].tier.name}
                      </Badge>
                      <span className="font-black text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {filteredStudents[0].totalXp} XP
                      </span>
                    </div>
                  </Card>
                )}

                {/* 3rd Place */}
                {filteredStudents[2] && (
                  <Card
                    onClick={() => setSelectedStudent(filteredStudents[2])}
                    className="border border-slate-200/90 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer order-3 md:order-3 md:h-[280px] flex flex-col justify-between p-6 text-center group"
                  >
                    <div className="space-y-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center mx-auto">
                        3
                      </div>
                      <img
                        src={filteredStudents[2].avatarUrl}
                        className="w-14 h-14 rounded-2xl mx-auto object-cover border-2 border-slate-200 bg-slate-50 shadow-sm"
                        alt="Bronze Student"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {filteredStudents[2].name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {filteredStudents[2].college}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {filteredStudents[2].displayBranch}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Badge className={`${filteredStudents[2].tier.badgeStyle} text-[10px] font-semibold border shadow-none`}>
                        {filteredStudents[2].tier.name}
                      </Badge>
                      <span className="font-extrabold text-xs text-slate-900">
                        {filteredStudents[2].totalXp} XP
                      </span>
                    </div>
                  </Card>
                )}
              </div>

              {/* REMAINING RANKS LIST - STRICT CSS GRID ALIGNMENT */}
              {filteredStudents.length > 3 && (
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 space-y-2">
                  <div className="hidden sm:grid grid-cols-12 items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 border-b border-slate-100">
                    <span className="col-span-5">Rank & Student</span>
                    <span className="col-span-4">College & Branch</span>
                    <span className="col-span-3 text-right">Total Score</span>
                  </div>

                  <div className="space-y-1.5">
                    {filteredStudents.slice(3).map((st, index) => {
                      const rankNum = index + 4;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStudent(st)}
                          className={`grid grid-cols-12 items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border ${
                            st.isCurrentUser
                              ? 'bg-indigo-50/60 border-indigo-200 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-100'
                          }`}
                        >
                          {/* Col 1: Rank + Avatar + Name (col-span-12 on mobile, col-span-5 on desktop) */}
                          <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                            <span className="w-5 text-center font-bold text-slate-400 text-xs shrink-0">
                              #{rankNum}
                            </span>
                            <img
                              src={st.avatarUrl}
                              alt={st.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                  {st.name}
                                </span>
                                {st.isCurrentUser && (
                                  <Badge className="bg-indigo-600 text-white font-bold text-[9px] px-1 py-0 h-4">
                                    YOU
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 truncate block sm:hidden">
                                {st.college} • {st.displayBranch}
                              </span>
                            </div>
                          </div>

                          {/* Col 2: College & Branch (col-span-4) */}
                          <div className="hidden sm:flex col-span-4 flex-col justify-center min-w-0 text-left pr-2">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {st.college}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {st.displayBranch}
                            </span>
                          </div>

                          {/* Col 3: Score & Tier (col-span-12 on mobile, col-span-3 on desktop) */}
                          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2 text-right">
                            <Badge className={`${st.tier.badgeStyle} text-[10px] font-semibold border hidden md:inline-flex shadow-none`}>
                              {st.tier.name}
                            </Badge>
                            <span className="font-extrabold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              {st.totalXp} XP
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* =========================================================================
            TRACK 2: TOP CLUBS
           ========================================================================= */}
        <TabsContent value="clubs" className="space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-black/5">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center space-y-3 shadow-sm">
              <Building2 className="h-8 w-8 text-indigo-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Clubs Found</h3>
            </div>
          ) : (
            <>
              {/* TOP 3 PODIUM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-2">
                {/* 2nd Place Club */}
                {filteredClubs[1] && (
                  <Card
                    onClick={() => setSelectedClub(filteredClubs[1])}
                    className="border border-slate-200/90 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer order-2 md:order-1 md:h-[300px] flex flex-col justify-between p-6 text-center group"
                  >
                    <div className="space-y-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mx-auto">
                        2
                      </div>
                      {filteredClubs[1].logo_url ? (
                        <img
                          src={filteredClubs[1].logo_url}
                          className="w-16 h-16 rounded-2xl mx-auto object-cover border-2 border-slate-200 bg-slate-50 shadow-sm"
                          alt="Silver Club"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl mx-auto bg-slate-100 text-slate-700 font-bold text-xl flex items-center justify-center border border-slate-200">
                          {filteredClubs[1].name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {filteredClubs[1].name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {filteredClubs[1].college}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-semibold">
                        {filteredClubs[1].category}
                      </Badge>
                      <span className="font-extrabold text-xs text-slate-900">
                        {filteredClubs[1].totalScore} pts
                      </span>
                    </div>
                  </Card>
                )}

                {/* 1st Place Club */}
                {filteredClubs[0] && (
                  <Card
                    onClick={() => setSelectedClub(filteredClubs[0])}
                    className="border-2 border-amber-300 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer order-1 md:order-2 md:h-[330px] flex flex-col justify-between p-6 text-center group transform md:-translate-y-2"
                  >
                    <div className="space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-400 text-white font-black text-xs flex items-center justify-center mx-auto shadow-sm">
                        1
                      </div>
                      {filteredClubs[0].logo_url ? (
                        <img
                          src={filteredClubs[0].logo_url}
                          className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-amber-300 bg-slate-50 shadow-md"
                          alt="Gold Club"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl mx-auto bg-amber-50 text-amber-800 font-extrabold text-2xl flex items-center justify-center border-2 border-amber-300">
                          {filteredClubs[0].name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {filteredClubs[0].name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                          {filteredClubs[0].college}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                        {filteredClubs[0].category}
                      </Badge>
                      <span className="font-black text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {filteredClubs[0].totalScore} pts
                      </span>
                    </div>
                  </Card>
                )}

                {/* 3rd Place Club */}
                {filteredClubs[2] && (
                  <Card
                    onClick={() => setSelectedClub(filteredClubs[2])}
                    className="border border-slate-200/90 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer order-3 md:order-3 md:h-[280px] flex flex-col justify-between p-6 text-center group"
                  >
                    <div className="space-y-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center mx-auto">
                        3
                      </div>
                      {filteredClubs[2].logo_url ? (
                        <img
                          src={filteredClubs[2].logo_url}
                          className="w-14 h-14 rounded-2xl mx-auto object-cover border-2 border-slate-200 bg-slate-50 shadow-sm"
                          alt="Bronze Club"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl mx-auto bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center border border-slate-200">
                          {filteredClubs[2].name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {filteredClubs[2].name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {filteredClubs[2].college}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-semibold">
                        {filteredClubs[2].category}
                      </Badge>
                      <span className="font-extrabold text-xs text-slate-900">
                        {filteredClubs[2].totalScore} pts
                      </span>
                    </div>
                  </Card>
                )}
              </div>

              {/* REMAINING CLUBS LIST - STRICT GRID ALIGNMENT */}
              {filteredClubs.length > 3 && (
                <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 space-y-2">
                  <div className="hidden sm:grid grid-cols-12 items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 border-b border-slate-100">
                    <span className="col-span-5">Rank & Club</span>
                    <span className="col-span-4">Category & College</span>
                    <span className="col-span-3 text-right">Total Points</span>
                  </div>

                  <div className="space-y-1.5">
                    {filteredClubs.slice(3).map((cl, index) => {
                      const rankNum = index + 4;
                      return (
                        <div
                          key={cl.id}
                          onClick={() => setSelectedClub(cl)}
                          className="grid grid-cols-12 items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border bg-white hover:bg-slate-50 border-slate-100"
                        >
                          <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                            <span className="w-5 text-center font-bold text-slate-400 text-xs shrink-0">
                              #{rankNum}
                            </span>
                            {cl.logo_url ? (
                              <img
                                src={cl.logo_url}
                                alt={cl.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100 shrink-0">
                                {cl.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                                {cl.name}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate block sm:hidden">
                                {cl.college}
                              </span>
                            </div>
                          </div>

                          <div className="hidden sm:flex col-span-4 flex-col justify-center min-w-0 text-left pr-2">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {cl.college}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize truncate">
                              {cl.category}
                            </span>
                          </div>

                          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2 text-right">
                            <span className="font-extrabold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              {cl.totalScore} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* =========================================================================
            TRACK 3: COLLEGE LEAGUE (CLEAN, DEDUPLICATED, NO 'UNKNOWN')
           ========================================================================= */}
        <TabsContent value="colleges" className="space-y-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-black/5">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : filteredColleges.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-black/5 text-center space-y-3 shadow-sm">
              <Building2 className="h-8 w-8 text-indigo-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Colleges Found</h3>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 space-y-2">
              <div className="hidden sm:grid grid-cols-12 items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 border-b border-slate-100">
                <span className="col-span-5">Rank & College</span>
                <span className="col-span-4">Campus Stats</span>
                <span className="col-span-3 text-right">League Points</span>
              </div>

              <div className="space-y-1.5">
                {filteredColleges.map((col, index) => {
                  const rankNum = index + 1;
                  return (
                    <div
                      key={col.collegeName}
                      onClick={() => setSelectedCollege(col)}
                      className={`grid grid-cols-12 items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border ${
                        col.isUserCollege
                          ? 'bg-indigo-50/60 border-indigo-200 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      {/* Col 1: Rank & Name */}
                      <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            rankNum === 1
                              ? 'bg-amber-400 text-white'
                              : rankNum === 2
                              ? 'bg-slate-200 text-slate-800'
                              : rankNum === 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {rankNum}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {col.collegeName}
                            </span>
                            {col.isUserCollege && (
                              <Badge className="bg-indigo-600 text-white font-bold text-[9px] px-1 py-0 h-4">
                                YOUR CAMPUS
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block sm:hidden">
                            {col.totalStudents} {col.totalStudents === 1 ? 'Student' : 'Students'} • {col.totalClubs} {col.totalClubs === 1 ? 'Club' : 'Clubs'}
                          </span>
                        </div>
                      </div>

                      {/* Col 2: Campus Stats with Grammatical Singular/Plural */}
                      <div className="hidden sm:flex col-span-4 items-center gap-2 text-xs font-semibold text-slate-600 flex-wrap">
                        <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          {col.totalStudents} {col.totalStudents === 1 ? 'Student' : 'Students'}
                        </span>
                        <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          {col.totalClubs} {col.totalClubs === 1 ? 'Club' : 'Clubs'}
                        </span>
                        <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          {col.totalCertificates} {col.totalCertificates === 1 ? 'Credential' : 'Credentials'}
                        </span>
                      </div>

                      {/* Col 3: Points */}
                      <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2 text-right">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          {col.totalPoints.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          MODAL 1: STUDENT BREAKDOWN DIALOG
         ========================================================================= */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
          {selectedStudent && (
            <div className="space-y-4">
              <DialogHeader className="text-left space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.avatarUrl}
                    alt={selectedStudent.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm bg-slate-50"
                  />
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-900">
                      {selectedStudent.name}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 font-medium">{selectedStudent.college}</p>
                    <Badge className={`${selectedStudent.tier.badgeStyle} text-[10px] font-semibold mt-1 border shadow-none`}>
                      {selectedStudent.tier.name}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-700">Total XP Score</span>
                  <p className="text-xl font-extrabold text-slate-900">{selectedStudent.totalXp} XP</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-500">Major / Branch</span>
                  <p className="text-xs font-bold text-slate-800">{selectedStudent.displayBranch}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Score Breakdown
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Event Attendance ({selectedStudent.scoreBreakdown.attendedCount} × 30 XP)
                    </span>
                    <span className="font-bold text-slate-900">+{selectedStudent.scoreBreakdown.attendedPoints} XP</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Verified Credentials ({selectedStudent.scoreBreakdown.certCount} × 50 XP)
                    </span>
                    <span className="font-bold text-slate-900">+{selectedStudent.scoreBreakdown.certPoints} XP</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Event Registrations ({selectedStudent.scoreBreakdown.regCount} × 10 XP)
                    </span>
                    <span className="font-bold text-slate-900">+{selectedStudent.scoreBreakdown.regPoints} XP</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Club Memberships ({selectedStudent.scoreBreakdown.memberCount} × 15 XP)
                    </span>
                    <span className="font-bold text-slate-900">+{selectedStudent.scoreBreakdown.memberPoints} XP</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: CLUB BREAKDOWN DIALOG
         ========================================================================= */}
      <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
          {selectedClub && (
            <div className="space-y-4">
              <DialogHeader className="text-left space-y-2">
                <div className="flex items-center gap-3">
                  {selectedClub.logo_url ? (
                    <img
                      src={selectedClub.logo_url}
                      alt={selectedClub.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm bg-slate-50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-lg flex items-center justify-center border border-indigo-100">
                      {selectedClub.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-900">
                      {selectedClub.name}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 font-medium">{selectedClub.college}</p>
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-semibold mt-1">
                      {selectedClub.category}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Total Score</span>
                  <p className="text-xl font-extrabold text-slate-900">{selectedClub.totalScore} pts</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-500">Active Members</span>
                  <p className="text-xs font-bold text-slate-800">{selectedClub.membersCount} members</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Score Breakdown
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">Event Turnout & Attendance</span>
                    <span className="font-bold text-slate-900">+{selectedClub.scoreBreakdown.turnoutPoints} pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Events Hosted ({selectedClub.completedEvents} × 50 pts)
                    </span>
                    <span className="font-bold text-slate-900">+{selectedClub.scoreBreakdown.eventPoints} pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Members ({selectedClub.membersCount} × 10 pts)
                    </span>
                    <span className="font-bold text-slate-900">+{selectedClub.scoreBreakdown.memberPoints} pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Prize Pool (₹{selectedClub.totalPrizePool.toLocaleString()})
                    </span>
                    <span className="font-bold text-slate-900">+{selectedClub.scoreBreakdown.prizePoints} pts</span>
                  </div>
                  {selectedClub.is_verified && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold">
                      <span>Verified Club Status</span>
                      <span>+200 pts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: SCORING RULES
         ========================================================================= */}
      <Dialog open={scoringGuideOpen} onOpenChange={setScoringGuideOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Clunite Scoring Rules
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Points and levels calculation for students and clubs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide">Student XP System</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block">+50 XP</span>
                  <span className="text-[11px] text-slate-500">Verified Certificate</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block">+30 XP</span>
                  <span className="text-[11px] text-slate-500">Attendance (QR Scanned)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block">+15 XP</span>
                  <span className="text-[11px] text-slate-500">Club Membership</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block">+10 XP</span>
                  <span className="text-[11px] text-slate-500">Event Registration</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide">Club Points Formula</span>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                Clubs accumulate points through events hosted (<strong>+50 pts</strong>), attendance turnout (<strong>+15 pts/attendee</strong>), active members (<strong>+10 pts/member</strong>), verified badge (<strong>+200 pts</strong>), and prize pools distributed.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
