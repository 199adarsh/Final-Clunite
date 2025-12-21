'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserFromDatabase } from '@/lib/sync-user';
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
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (authUser) {
        const dbUser = await getUserFromDatabase(authUser.id);
        setUserData(dbUser);
      } else if (!authLoading) {
        router.push('/login');
        return;
      }
      setLoading(false);
    }

    if (!authLoading) loadUserData();
  }, [authUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authUser) {
    router.push('/login');
    return null;
  }

  const user = {
    name: userData?.full_name || 'Student',
    college: userData?.college || 'Your College',
  };

  const achievements = [
    {
      title: 'Registered Events',
      value: '12',
      change: '+3 this month',
      icon: Calendar,
    },
    {
      title: 'Certificates Earned',
      value: '8',
      change: '+2 this semester',
      icon: Award,
    },
    {
      title: 'Events Attended',
      value: '15',
      change: '+5 this month',
      icon: Users,
    },
    {
      title: 'QR Scans',
      value: '23',
      change: '+8 recent',
      icon: QrCode,
    },
  ];

  const recommendedEvents = [
    {
      id: 1,
      title: 'AI & Machine Learning Workshop',
      club: 'Tech Club',
      date: 'Dec 15, 2024',
      time: '2:00 PM',
      venue: 'Auditorium A',
      rating: 4.8,
      tags: ['Technology', 'Workshop'],
    },
    {
      id: 2,
      title: 'Cultural Fest 2024',
      club: 'Cultural Committee',
      date: 'Dec 20, 2024',
      time: '6:00 PM',
      venue: 'Main Ground',
      rating: 4.9,
      tags: ['Cultural', 'Festival'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background p-6 space-y-10">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Track your progress and achievements at{' '}
            <span className="font-medium text-foreground">{user.college}</span>
          </p>

          <div className="mt-6 flex gap-3">
            <Badge className="bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />5 new recommendations
            </Badge>
            <Badge variant="secondary">
              <Target className="h-3 w-3 mr-1" />2 events this week
            </Badge>
          </div>
        </div>
      </div>

      {/* 🍎 TRUE LIQUID GLASS ACHIEVEMENTS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {achievements.map((item, index) => (
          <div
            key={index}
            className="
              relative rounded-2xl overflow-hidden
              backdrop-blur-2xl
              bg-white/35 dark:bg-white/5
              shadow-[0_20px_60px_rgba(0,0,0,0.08)]
              ring-1 ring-white/40
              transition-all duration-300
              hover:-translate-y-1
            "
          >
            {/* ambient color wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent opacity-70" />

            {/* inner light edge */}
            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" />

            <div className="relative p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  Achievement
                </span>
              </div>

              <div>
                <p className="text-4xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="text-sm text-muted-foreground">{item.title}</p>
              </div>

              <p className="text-xs text-muted-foreground">{item.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* RECOMMENDED EVENTS (RESTORED) */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Recommended for you
              </CardTitle>
              <CardDescription>
                Curated events that match your interests
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {recommendedEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.club}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      {event.rating}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.venue}
                    </span>
                  </div>

                  <Button size="sm">Register</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Certificates
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                My events
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <p className="font-medium">Achievement unlocked</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You’ve attended 15 events this semester.
              </p>
              <Button size="sm" variant="outline">
                View progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
