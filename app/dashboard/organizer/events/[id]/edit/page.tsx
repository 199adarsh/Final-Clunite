import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"

async function getEvent(eventId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single()

  return event
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)

  if (!event) {
    return <div>Event not found</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/organizer/host/analytics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
            <p className="text-gray-600 mt-1">Update your event details</p>
          </div>
        </div>

        <form className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the core details of your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Banner Upload */}
              <div className="space-y-2">
                <Label>Event Banner</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  {event.banner_url ? (
                    <div className="relative">
                      <img
                        src={event.banner_url || "/placeholder.svg"}
                        alt="Event banner"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">Upload event banner</p>
                        <p className="text-gray-600">PNG, JPG up to 5MB</p>
                      </div>
                      <Button type="button" variant="outline">
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input id="title" defaultValue={event.title} placeholder="Enter event title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select defaultValue={event.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  defaultValue={event.description}
                  placeholder="Describe your event..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Logistics */}
          <Card>
            <CardHeader>
              <CardTitle>Event Logistics</CardTitle>
              <CardDescription>Set the time, location, and capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date *</Label>
                  <Input id="date" type="date" defaultValue={event.date?.split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Event Time *</Label>
                  <Input id="time" type="time" defaultValue={event.time} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" defaultValue={event.location} placeholder="Event venue or online link" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input id="duration" type="number" defaultValue={event.duration} placeholder="2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Participation Settings</CardTitle>
              <CardDescription>Configure registration and team settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    defaultValue={event.max_participants}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minTeamSize">Min Team Size</Label>
                  <Input id="minTeamSize" type="number" defaultValue={event.min_team_size} placeholder="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTeamSize">Max Team Size</Label>
                  <Input id="maxTeamSize" type="number" defaultValue={event.max_team_size} placeholder="1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    defaultValue={event.registration_deadline?.replace("Z", "")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" step="0.01" defaultValue={event.price} placeholder="0.00" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/organizer/host/analytics">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Update Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
