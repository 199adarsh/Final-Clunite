'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  Sparkles,
  Users,
  Calendar,
  Building2,
  Check,
  Compass,
  Plus,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { CollegeAutocomplete } from '@/components/college-autocomplete';
import { joinClubInstant } from '@/hooks/useClubs';
import { toast } from 'sonner';

function calculateAccuracyScore(club: any, userInterests: string[], userSkills: string[]) {
  const queryTags = [...userInterests, ...userSkills].map((t) => t.toLowerCase());
  if (queryTags.length === 0) {
    return { score: 75, matchedTags: [] };
  }

  const name = (club.name || '').toLowerCase();
  const description = (club.description || '').toLowerCase();
  const tagline = (club.tagline || '').toLowerCase();
  const category = (club.category || '').toLowerCase();
  const clubText = `${name} ${tagline} ${description} ${category}`;

  let matchedCount = 0;
  const matchedTagsList: string[] = [];

  queryTags.forEach((tag) => {
    if (clubText.includes(tag)) {
      matchedCount++;
      matchedTagsList.push(tag);
    } else {
      const stem = tag.substring(0, 4);
      if (stem.length >= 4 && clubText.includes(stem)) {
        matchedCount++;
        matchedTagsList.push(tag);
      }
    }
  });

  let categoryMatch = false;
  userInterests.forEach((interest) => {
    const iLower = interest.toLowerCase();
    if (
      category.includes('tech') &&
      ['technology', 'coding', 'ai/ml', 'robotics', 'web development', 'data science'].includes(iLower)
    ) {
      categoryMatch = true;
    }
    if (
      category.includes('cultur') &&
      ['arts & culture', 'music', 'photography', 'literature', 'debate'].includes(iLower)
    ) {
      categoryMatch = true;
    }
    if (category.includes('social') && ['social work', 'entrepreneurship'].includes(iLower)) {
      categoryMatch = true;
    }
  });

  const matchRatio = matchedCount / queryTags.length;
  let score = 50 + matchRatio * 40 + (categoryMatch ? 9 : 0);
  score = Math.min(Math.round(score), 99);

  return {
    score,
    matchedTags: matchedTagsList,
  };
}

export default function DiscoverClubsPage() {
  const { user: authUser } = useAuth();
  const userId = authUser?.id;

  const [interests, setInterests] = useState<string[]>([
    'Technology',
    'Coding',
    'AI/ML',
  ]);
  const [skills, setSkills] = useState<string[]>(['Problem Solving', 'Design']);
  const [scopePreference, setScopePreference] = useState<'same' | 'all'>('same');
  const [userCollege, setUserCollege] = useState('');
  const [customCollegeFilter, setCustomCollegeFilter] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [suggestedClubs, setSuggestedClubs] = useState<any[]>([]);
  const [fallbackClubs, setFallbackClubs] = useState<any[]>([]);
  const [hasDirectMatches, setHasDirectMatches] = useState(true);
  const [loading, setLoading] = useState(false);
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);

  const availableInterests = [
    'Technology',
    'Coding',
    'AI/ML',
    'Data Science',
    'Web Development',
    'Robotics',
    'Entrepreneurship',
    'Arts & Culture',
    'Music',
    'Photography',
    'Sports & Gaming',
    'Social Work',
    'Debate & MUN',
    'Finance',
    'Marketing',
  ];

  const availableSkills = [
    'Problem Solving',
    'Design & UI/UX',
    'Public Speaking',
    'Leadership',
    'Event Management',
    'Writing & Content',
    'Video Editing',
    'Marketing',
    'Networking',
  ];

  useEffect(() => {
    async function loadUserCollege() {
      if (authUser) {
        const { data, error } = await supabase
          .from('users')
          .select('college')
          .eq('id', authUser.id)
          .single();
        if (!error && data) {
          setUserCollege(data.college || '');
        }
      }
    }
    loadUserCollege();
  }, [authUser]);

  // Trigger matchmaker computation
  const handleFindMatches = async () => {
    try {
      setLoading(true);

      const targetCollege =
        scopePreference === 'same'
          ? userCollege
          : customCollegeFilter || null;

      let query = supabase.from('clubs').select('*');

      if (targetCollege) {
        query = query.ilike('college', `%${targetCollege}%`);
      }

      const { data: dbClubs, error } = await query;
      if (error) throw error;

      const scored = (dbClubs || []).map((club: any) => {
        const { score, matchedTags } = calculateAccuracyScore(club, interests, skills);
        return {
          ...club,
          matchScore: score,
          matchedTags,
        };
      });

      scored.sort((a, b) => b.matchScore - a.matchScore);

      if (scored.length > 0) {
        setSuggestedClubs(scored);
        setHasDirectMatches(true);
      } else {
        // Fallback to national clubs
        const { data: allDbClubs } = await supabase.from('clubs').select('*').limit(6);
        const fallbackScored = (allDbClubs || []).map((c: any) => ({
          ...c,
          matchScore: 65,
          matchedTags: interests.slice(0, 2),
        }));
        setFallbackClubs(fallbackScored);
        setHasDirectMatches(false);
      }

      setQuizCompleted(true);
    } catch (err) {
      console.error('Error finding club matches:', err);
      toast.error('Failed to calculate matches.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (clubId: string, clubName: string) => {
    if (!userId) {
      toast.error('Please log in to join clubs.');
      return;
    }

    try {
      setJoiningClubId(clubId);
      await joinClubInstant(userId, clubId);
      toast.success(`Joined ${clubName}!`);
    } catch (err) {
      console.error('Error joining club:', err);
      toast.error('Failed to join club.');
    } finally {
      setJoiningClubId(null);
    }
  };

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSkill = (item: string) => {
    setSkills((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6 sm:space-y-8 antialiased">
      {/* ================= HEADER ================= */}
      <div className="relative rounded-2xl bg-white border border-black/5 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/60 via-purple-100/30 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Club Matchmaker & Discovery
            </h1>
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs">
              AI Recommendations
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Select your passions and skills to find campus communities tailored to your aspirations.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link href="/dashboard/student/my-clubs">
            <Button variant="ghost" className="rounded-xl text-xs font-semibold h-9 text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to My Clubs
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= PREFERENCES & MATCHMAKER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Preferences Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interests Pill Selector */}
          <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                1. Select Your Interests & Passions
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Choose the domains you are curious about or love working in.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => {
                  const isSelected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Skills Pill Selector */}
          <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="h-4 w-4 text-purple-600" />
                2. Select Your Skills & Strengths
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pick what you bring to a student committee or club team.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Scope & Compute Action */}
        <div className="space-y-6">
          <Card className="border border-black/5 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                3. Campus Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setScopePreference('same')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    scopePreference === 'same'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  My College
                </button>
                <button
                  onClick={() => setScopePreference('all')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    scopePreference === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All Colleges
                </button>
              </div>

              {scopePreference === 'all' && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Filter by University:</span>
                  <CollegeAutocomplete
                    placeholder="Search college..."
                    value={customCollegeFilter}
                    onChange={(val) => setCustomCollegeFilter(val)}
                    allowPartialOnBlur={true}
                    className="h-9 text-xs bg-slate-50 border-slate-200"
                  />
                </div>
              )}

              <Button
                onClick={handleFindMatches}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs h-10 shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Find Matching Clubs</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================= RESULTS SECTION ================= */}
      {quizCompleted && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Recommended For You</h2>
              <p className="text-xs text-slate-500 font-medium">
                Ranked by alignment with your selected passions and strengths.
              </p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
              {suggestedClubs.length || fallbackClubs.length} Matches Found
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(hasDirectMatches ? suggestedClubs : fallbackClubs).map((club) => (
              <Card
                key={club.id}
                className="border border-black/5 shadow-sm rounded-2xl bg-white hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-16 bg-gradient-to-r from-indigo-100/70 via-purple-50/50 to-slate-100 p-4 flex items-start justify-between">
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold capitalize">
                      {club.category || 'Technical'}
                    </Badge>
                    <span className="text-xs font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 shadow-sm">
                      {club.matchScore}% Match
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
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center border-2 border-white shadow-md">
                          {club.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-base truncate">{club.name}</h3>
                        {club.is_verified && <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {club.description || 'Active campus student society fostering collaboration and growth.'}
                      </p>
                    </div>

                    {/* Matched Tags */}
                    {club.matchedTags && club.matchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-3 mt-3 border-t border-slate-100">
                        {club.matchedTags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="bg-slate-50 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200/60 capitalize"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/student/my-clubs/${club.id}`}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>View Hub</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handleJoin(club.id, club.name)}
                    disabled={joiningClubId === club.id}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    {joiningClubId === club.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    <span>Join Club</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
