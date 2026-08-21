"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Search, Lightbulb, Users, Calendar, Star, Building2, UserCheck, TrendingUp, Loader2 } from 'lucide-react'
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

function calculateAccuracyScore(club: any, userInterests: string[], userSkills: string[]) {
  const queryTags = [...userInterests, ...userSkills].map(t => t.toLowerCase());
  if (queryTags.length === 0) {
    return { score: 50, matchedTags: [] };
  }

  const name = (club.name || '').toLowerCase();
  const description = (club.description || '').toLowerCase();
  const tagline = (club.tagline || '').toLowerCase();
  const category = (club.category || '').toLowerCase();
  const clubText = `${name} ${tagline} ${description} ${category}`;

  let matchedCount = 0;
  const matchedTagsList: string[] = [];

  queryTags.forEach(tag => {
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
  userInterests.forEach(interest => {
    const iLower = interest.toLowerCase();
    if (category.includes('tech') && ['technology', 'coding', 'ai/ml', 'robotics', 'web development', 'data science'].includes(iLower)) {
      categoryMatch = true;
    }
    if (category.includes('cultur') && ['arts & culture', 'music', 'photography', 'literature', 'debate'].includes(iLower)) {
      categoryMatch = true;
    }
    if (category.includes('social') && ['social work', 'entrepreneurship'].includes(iLower)) {
      categoryMatch = true;
    }
  });

  const matchRatio = matchedCount / queryTags.length;
  // Base 40% + 50% match ratio + 10% semantic category match bonus
  let score = 40 + (matchRatio * 50) + (categoryMatch ? 10 : 0);
  score = Math.min(Math.round(score), 99);

  return {
    score,
    matchedTags: matchedTagsList
  };
}

export default function DiscoverClubsPage() {
  const { user: authUser } = useAuth()
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [scopePreference, setScopePreference] = useState("same")
  const [userCollege, setUserCollege] = useState("")
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [suggestedClubs, setSuggestedClubs] = useState<any[]>([])
  const [fallbackClubs, setFallbackClubs] = useState<any[]>([])
  const [hasDirectMatches, setHasDirectMatches] = useState(true)
  const [loading, setLoading] = useState(false)

  const availableInterests = [
    "Technology",
    "Data Science",
    "Entrepreneurship",
    "Arts & Culture",
    "Sports",
    "Social Work",
    "Debate",
    "Photography",
    "Music",
    "Literature",
    "Robotics",
    "AI/ML",
    "Web Development",
    "Finance",
    "Marketing",
  ]
  const availableSkills = [
    "Coding",
    "Public Speaking",
    "Leadership",
    "Writing",
    "Design",
    "Marketing",
    "Event Management",
    "Research",
    "Problem Solving",
    "Data Analysis",
    "Project Management",
    "Networking",
  ]

  useEffect(() => {
    async function loadUserCollege() {
      if (authUser) {
        const { data, error } = await supabase
          .from('users')
          .select('college')
          .eq('id', authUser.id)
          .single()
        if (!error && data) {
          setUserCollege(data.college)
        }
      }
    }
    loadUserCollege()
  }, [authUser])

  const handleInterestChange = (interest: string, checked: boolean) => {
    setInterests((prev) => (checked ? [...prev, interest] : prev.filter((i) => i !== interest)))
  }

  const handleSkillChange = (skill: string, checked: boolean) => {
    setSkills((prev) => (checked ? [...prev, skill] : prev.filter((s) => s !== skill)))
  }

  const handleSubmitQuiz = async () => {
    try {
      setLoading(true)

      const { data: dbClubs, error: clubsErr } = await supabase
        .from('clubs')
        .select('*')
        .eq('is_verified', true)

      if (clubsErr) throw clubsErr

      const list = dbClubs || []

      const scoredClubs = list.map((club: any) => {
        const isSameCollege = club.college?.toLowerCase() === userCollege.toLowerCase()
        const { score, matchedTags } = calculateAccuracyScore(club, interests, skills)
        
        let popularity = "Rising"
        if (club.members_count > 10) popularity = "Very High"
        else if (club.members_count > 5) popularity = "High"
        else if (club.members_count > 2) popularity = "Medium"

        return {
          ...club,
          matchScore: score,
          matchedInterests: matchedTags,
          isSameCollege,
          popularity
        }
      })

      // Partition by scope
      const targetScopeClubs = scoredClubs.filter((club: any) => {
        if (scopePreference === 'same') {
          return club.isSameCollege
        } else {
          return !club.isSameCollege
        }
      })

      // Accurately filter matches with matchScore >= 60% and matchedInterests
      const direct = targetScopeClubs
        .filter((club: any) => club.matchedInterests.length > 0 && club.matchScore >= 60)
        .sort((a, b) => b.matchScore - a.matchScore)

      if (direct.length > 0) {
        setSuggestedClubs(direct)
        setHasDirectMatches(true)
        setFallbackClubs([])
      } else {
        setSuggestedClubs([])
        setHasDirectMatches(false)

        // General recommendations fallback
        const fallbackList = scoredClubs
          .sort((a: any, b: any) => {
            if (b.matchScore !== a.matchScore) {
              return b.matchScore - a.matchScore
            }
            return (b.members_count || 0) - (a.members_count || 0)
          })
          .slice(0, 6)

        setFallbackClubs(fallbackList)
      }

      setQuizCompleted(true)
    } catch (err) {
      console.error('Error suggesting clubs:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Your Fit</h1>
              <p className="text-lg text-gray-600">Find clubs that align with your passions and talents</p>
            </div>
            <Link
              href="/dashboard/student/my-clubs"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to My Clubs
            </Link>
          </div>
        </div>

        {!quizCompleted ? (
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">Tell Us About Yourself</CardTitle>
              <CardDescription className="text-gray-600">
                Select your interests and skills to get personalized club recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Interests */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Interests</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {availableInterests.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={interests.includes(interest)}
                        onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                      />
                      <Label htmlFor={`interest-${interest}`} className="text-base font-medium text-gray-700">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Skills</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={skills.includes(skill)}
                        onCheckedChange={(checked) => handleSkillChange(skill, checked as boolean)}
                      />
                      <Label htmlFor={`skill-${skill}`} className="text-base font-medium text-gray-700">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Club Scope Preference */}
              <div className="space-y-3 border-t pt-6">
                <Label className="text-xl font-semibold text-gray-900">Club Scope Preference</Label>
                <p className="text-sm text-gray-600">Choose whether to view clubs only from your campus or expand search to other colleges.</p>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scopePreference"
                      value="same"
                      checked={scopePreference === "same"}
                      onChange={() => setScopePreference("same")}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-gray-700 font-semibold">My College Only ({userCollege || "DKTE"})</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scopePreference"
                      value="inter"
                      checked={scopePreference === "inter"}
                      onChange={() => setScopePreference("inter")}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-gray-700 font-semibold">Intercollege (Other Colleges)</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSubmitQuiz}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium text-base flex justify-center items-center h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Finding Clubs...
                  </>
                ) : (
                  "Find My Clubs"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Personalized Club Matches!</h2>
              <p className="text-lg text-gray-600">Based on your interests and skills, here are some clubs you might love.</p>
            </Card>

            {!hasDirectMatches && (
              <Card className="p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <h3 className="text-lg font-bold text-amber-800 flex items-center">
                  ⚠️ No exact matches found for "{scopePreference === 'same' ? 'My College Only' : 'Intercollege'}"
                </h3>
                <p className="text-amber-700 text-sm">
                  We couldn't find any direct matches fitting your interest tags in this scope. However, check out these highly recommended clubs from either your college or other colleges:
                </p>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(hasDirectMatches ? suggestedClubs : fallbackClubs).map((club) => (
                <Card
                  key={club.id}
                  className="border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                >
                  <Link href={`/dashboard/student/my-clubs`}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {club.logo_url ? (
                          <img src={club.logo_url} alt={`${club.name} Logo`} className="w-16 h-16 rounded-full object-cover border" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                            {club.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{club.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1">{club.tagline || "No tagline"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {club.members_count || 0} Members
                        </div>
                        <Badge className="bg-green-100 text-green-700 font-semibold">
                          <Star className="h-3 w-3 mr-1" /> {club.matchScore}% Match
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                          Popularity: <span className="font-semibold ml-1">{club.popularity}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                          College: <span className="font-semibold ml-1">{club.college}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {club.matchedInterests.length > 0 ? (
                          club.matchedInterests.map((interest: any, idx: any) => (
                            <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700">
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            {club.category}
                          </Badge>
                        )}
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">View Clubs List</Button>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button onClick={() => setQuizCompleted(false)} variant="outline">
                Retake Quiz
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
