'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  MapPinIcon,
} from 'lucide-react';
import { supabase, type Event, type Club } from '@/lib/supabase';

interface EventWithClub extends Event {
  club?: Club | null;
}

/* ---------------- HELPERS ---------------- */

const statusStyle: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
};

const getModeIcon = (mode: string) => {
  if (mode === 'online') return <Globe className="h-4 w-4" />;
  if (mode === 'hybrid') return <Monitor className="h-4 w-4" />;
  return <MapPinIcon className="h-4 w-4" />;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/* ---------------- COMPONENT ---------------- */

export default function BrowseEventsPage() {
  const [events, setEvents] = useState<EventWithClub[]>([]);
  const [filtered, setFiltered] = useState<EventWithClub[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [mode, setMode] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, search, category, type, mode]);

  const fetchEvents = async () => {
    const now = new Date().toISOString();

    const { data } = await supabase
      .from('events')
      .select('*, club:clubs(*)')
      .eq('status', 'published')
      .gt('registration_deadline', now)
      .order('registration_deadline');

    setEvents(data || []);
    setLoading(false);
  };

  const applyFilters = () => {
    const q = search.toLowerCase();
    setFiltered(
      events.filter(
        (e) =>
          (e.title.toLowerCase().includes(q) ||
            e.club?.name.toLowerCase().includes(q)) &&
          (category === 'all' || e.category === category) &&
          (type === 'all' || e.type === type) &&
          (mode === 'all' || e.mode === mode)
      )
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f6f7fb]" />;
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ================= HEADER CARD ================= */}
        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            bg-white
            border border-black/5
            p-6
            flex items-center justify-between
            animate-in fade-in slide-in-from-bottom-2
            duration-500
          "
        >
          {/* decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/70 via-purple-100/40 to-transparent" />

          <div className="relative">
            <h1 className="text-3xl font-semibold tracking-tight">
              Discover Events
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Curated campus activities & competitions
            </p>
          </div>

          <div className="relative">
            <div className="rounded-full bg-indigo-100 text-indigo-700 px-4 py-1.5 text-sm font-medium">
              {filtered.length} events
            </div>
          </div>
        </div>

        {/* ================= FILTER BAR ================= */}
        <Card className="border border-black/5 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 h-9"
                placeholder="Search events or clubs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="competition">Competition</SelectItem>
              </SelectContent>
            </Select>

            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* ================= EVENTS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <Link key={event.id} href={`/dashboard/student/events/${event.id}`}>
              <Card
                className="
                  group
                  rounded-2xl
                  border border-black/5
                  bg-white
                  transition-all
                  hover:shadow-lg
                  hover:-translate-y-1
                "
              >
                {/* IMAGE */}
                <div className="relative">
                  <img
                    src={event.image_url || '/placeholder.svg'}
                    className="h-44 w-full object-cover rounded-t-2xl"
                  />

                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary">{event.type}</Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    <Badge
                      className={statusStyle[event.status] || 'bg-gray-100'}
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>

                {/* CONTENT */}
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold leading-snug line-clamp-2">
                      {event.title}
                    </h3>
                    {event.club && (
                      <p className="text-sm text-indigo-600 font-medium">
                        {event.club.name}
                      </p>
                    )}
                  </div>

                  {/* Meta block */}
                  <div className="rounded-lg bg-gray-50 p-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      {formatDate(event.start_date)}
                    </div>

                    <div className="flex items-center gap-2">
                      {getModeIcon(event.mode)}
                      {event.mode}
                      {event.venue && ` · ${event.venue}`}
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" />
                      {event.current_participants} participants
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-medium">
                      {event.entry_fee > 0 ? `₹${event.entry_fee}` : 'Free'}
                    </span>

                    {event.prize_pool && (
                      <span className="text-emerald-600 font-medium text-sm">
                        <Trophy className="h-4 w-4 inline mr-1" />₹
                        {event.prize_pool.toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
