"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Search, Lightbulb, Users, Calendar, Star, Building2, UserCheck, TrendingUp } from 'lucide-react'
import Link from "next/link"

export default function DiscoverClubsPage() {
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)

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

  // Enhanced mock data for suggested clubs with more recommendation factors
  const suggestedClubs = [
    {
      id: "tech-club",
      name: "Tech Club",
      tagline: "Innovate, Code, Create.",
      members: 250,
      eventsHosted: 12,
      logo: "/placeholder.svg?height=60&width=60&text=TC",
      matchScore: 90,
      matchedInterests: ["Technology", "Coding", "AI/ML", "Web Development"],
      popularity: "High",
      friendsInClub: 5,
    },
    {
      id: "data-science-club",
      name: "Data Science Club",
      tagline: "Unlocking Insights from Data.",
      members: 180,
      eventsHosted: 8,
      logo: "/placeholder.svg?height=60&width=60&text=DSC",
      matchScore: 85,
      matchedInterests: ["Data Science", "Coding", "Research", "Data Analysis"],
      popularity: "High",
      friendsInClub: 3,
    },
    {
      id: "entrepreneurship-cell",
      name: "Entrepreneurship Cell",
      tagline: "From Idea to Impact.",
      members: 300,
      eventsHosted: 15,
      logo: "/placeholder.svg?height=60&width=60&text=EC",
      matchScore: 75,
      matchedInterests: ["Entrepreneurship", "Marketing", "Problem Solving", "Networking"],
      popularity: "Very High",
      friendsInClub: 8,
    },
    {
      id: "robotics-club",
      name: "Robotics Club",
      tagline: "Building the Future, One Robot at a Time.",
      members: 120,
      eventsHosted: 7,
      logo: "/placeholder.svg?height=60&width=60&text=RC",
      matchScore: 88,
      matchedInterests: ["Technology", "Robotics", "Coding", "Problem Solving"],
      popularity: "Medium",
      friendsInClub: 2,
    },
    {
      id: "photography-club",
      name: "Photography Club",
      tagline: "Capture the Moment.",
      members: 100,
      eventsHosted: 5,
      logo: "/placeholder.svg?height=60&width=60&text=PC",
      matchScore: 60,
      matchedInterests: ["Photography", "Arts & Culture"],
      popularity: "Medium",
      friendsInClub: 1,
    },
  ]

  const handleInterestChange = (interest: string, checked: boolean) => {
    setInterests((prev) => (checked ? [...prev, interest] : prev.filter((i) => i !== interest)))
  }

  const handleSkillChange = (skill: string, checked: boolean) => {
    setSkills((prev) => (checked ? [...prev, skill] : prev.filter((s) => s !== skill)))
  }

  const handleSubmitQuiz = () => {
    setQuizCompleted(true)
    // In a real app, you'd send interests/skills to a backend for more sophisticated matching
    // and consider event attendance history, friends in the club, and popularity.
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

              {/* Optional: Free text for other interests/skills */}
              <div>
                <Label htmlFor="other-info" className="text-xl font-semibold text-gray-900 mb-2">
                  Anything else?
                </Label>
                <Textarea
                  id="other-info"
                  placeholder="Tell us more about your unique interests or skills..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleSubmitQuiz}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium text-base"
              >
                Find My Clubs
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedClubs.map((club) => (
                <Card
                  key={club.id}
                  className="border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                >
                  <Link href={`/dashboard/student/my-clubs/${club.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <img src={club.logo || "/placeholder.svg"} alt={`${club.name} Logo`} className="w-16 h-16 rounded-full" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{club.name}</h3>
                          <p className="text-sm text-gray-600">{club.tagline}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {club.members} Members
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          <Star className="h-3 w-3 mr-1" /> {club.matchScore}% Match
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                          Popularity: <span className="font-semibold ml-1">{club.popularity}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-semibold">{club.friendsInClub}</span> Friends in Club
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {club.matchedInterests.map((interest, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">View Club Profile</Button>
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
