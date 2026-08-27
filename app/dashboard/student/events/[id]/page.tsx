'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { CollegeAutocomplete } from '@/components/college-autocomplete';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventImage } from '@/components/EventImage';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Users,
  Eye,
  Heart,
  Share2,
  MapPin,
  Trophy,
  Star,
  Globe,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Tag,
  Award,
  Target,
  BookOpen,
  Zap,
  User,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { supabase, type Event, type Club } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface EventWithClub extends Event {
  club?: Club | null;
}

interface TeamMember {
  name: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  gender: string;
  branch: string;
  academic_year: string;
}

export default function EventDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithClub | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const [registrationData, setRegistrationData] = useState({
    // Solo participant data
    participantName: '',
    participantEmail: '',
    participantPhone: '',
    participantCollege: '',
    participantYear: '',
    participantGender: '',
    participantAcademicYear: '',
    participantSkills: '',
    participantExperience: '',
    // Team data
    teamName: '',
    teamMembers: [] as TeamMember[],
    // Additional info
    specialRequirements: '',
    dietaryRestrictions: '',
    branch: '',
  });

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  const renderFormattedDescription = (text: string) => {
    if (!text) return '';
    const paragraphs = text.split('\n');
    return paragraphs.map((p, idx) => {
      const isListItem = p.trim().startsWith('- ') || p.trim().startsWith('* ');
      let content = p;
      if (isListItem) {
        content = p.trim().substring(2);
      }
      
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }
      
      const renderedContent = parts.length > 0 ? parts : content;
      
      if (isListItem) {
        return (
          <li key={idx} className="ml-6 list-disc text-gray-700 leading-relaxed text-lg mb-1">
            {renderedContent}
          </li>
        );
      }
      return (
        <p key={idx} className="text-gray-700 leading-relaxed text-lg mb-4 min-h-[1rem]">
          {renderedContent}
        </p>
      );
    });
  };

  useEffect(() => {
    fetchEventDetails();
    if (user) {
      checkRegistrationStatus();
    }
  }, [params.id, user]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data: eventData, error } = await supabase
        .from('events')
        .select(
          `
          *,
          club:clubs(*)
        `
        )
        .eq('id', params.id)
        .single();

      if (error) throw error;

      // Increment view count in database (run silently without blocking load)
      const currentViews = Number((eventData as any)?.views) || 0;
      const newViews = currentViews + 1;
      try {
        if (eventData) {
          await supabase
            .from('events')
            .update({ views: newViews })
            .eq('id', params.id);
        }
      } catch (viewErr) {
        console.warn('Failed to update views count:', viewErr);
      }

      // Get fresh registration count
      const { data: regCount } = await supabase
        .from('event_registrations')
        .select('status, registration_data')
        .eq('event_id', params.id);

      // Calculate total participants including team members (excluding cancelled)
      const totalParticipants =
        regCount?.reduce((total, reg) => {
          if (reg.status === 'cancelled') return total;
          if (reg.registration_data?.team_members) {
            return total + reg.registration_data.team_members.length;
          } else if (reg.registration_data?.participant_details) {
            return total + 1;
          }
          return total;
        }, 0) || 0;

      // Update the event data with the fresh count & views
      const updatedEvent = {
        ...eventData,
        views: newViews,
        current_participants: totalParticipants,
      };

      setEvent(updatedEvent);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      if (!user) {
        setIsRegistered(false);
        return;
      }

      // Check registration for THIS specific user
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', params.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking registration:', error);
        return;
      }

      setIsRegistered(!!data);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const initializeTeamMembers = () => {
    if (!event) return;

    const requiredMembers =
      event.team_size === '2_people'
        ? 2
        : event.team_size === 'group_4+'
          ? 4
          : 1;
    const members: TeamMember[] = [];

    for (let i = 0; i < requiredMembers; i++) {
      members.push({
        name: '',
        email: '',
        phone: '',
        college: '',
        year: '',
        gender: '',
        branch: '',
        academic_year: '',
      });
    }

    setRegistrationData((prev) => ({ ...prev, teamMembers: members }));
  };

  const updateTeamMember = (
    index: number,
    field: keyof TeamMember,
    value: string
  ) => {
    setRegistrationData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const addTeamMember = () => {
    if (registrationData.teamMembers.length < 8) {
      // Max 8 members
      setRegistrationData((prev) => ({
        ...prev,
        teamMembers: [
          ...prev.teamMembers,
          {
            name: '',
            email: '',
            phone: '',
            college: '',
            year: '',
            gender: '',
            branch: '',
            academic_year: '',
          },
        ],
      }));
    }
  };

  const removeTeamMember = (index: number) => {
    const minMembers =
      event?.team_size === '2_people'
        ? 2
        : event?.team_size === 'group_4'
          ? 4
          : 1;
    if (registrationData.teamMembers.length > minMembers) {
      setRegistrationData((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((_, i) => i !== index),
      }));
    }
  };

  const handleRegistration = async () => {
    if (!event) return;

    if (isRegistered) {
      setErrorMessage('You are already registered for this event!');
      setRegistrationStatus('error');
      return;
    }

    if (event.team_size === 'solo') {
      setRegistrationData((prev) => ({
        ...prev,
        teamMembers: [
          {
            name: '',
            email: '',
            phone: '',
            college: '',
            year: '',
            gender: '',
            branch: '',
            academic_year: '',
          },
        ],
      }));
    } else {
      initializeTeamMembers();
    }

    setShowRegistrationDialog(true);
  };

  const submitRegistration = async () => {
    if (!event) return;

    try {
      setRegistering(true);
      setRegistrationStatus('idle');
      setErrorMessage('');
      setSuccessMessage('');

      // Validate custom questions (from event creator)
      if (event.contact_info?.custom_questions) {
        for (const q of event.contact_info.custom_questions) {
          if (q.required && !customAnswers[q.id]?.trim()) {
            throw new Error(`Please answer the required question: "${q.label}"`);
          }
        }
      }

      // Validate required fields
      if (event.team_size === 'solo') {
        const member = registrationData.teamMembers[0];
        if (!member.name || !member.email || !member.phone) {
          throw new Error('Please fill in all required fields');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(member.email)) {
          throw new Error('Please enter a valid email address');
        }

        // Check if already registered with this email
        const { data: existingReg } = await (supabase as any)
          .from('event_registrations')
          .select('id')
          .eq('event_id', params.id)
          .eq(
            'registration_data->participant_details->email',
            member.email.toLowerCase()
          )
          .maybeSingle();

        if (existingReg) {
          throw new Error(
            'This email address has already been used to register for this event'
          );
        }
      } else {
        // Validate team data
        if (!registrationData.teamName) {
          throw new Error('Please provide a team name');
        }

        // Check team member emails
        const emails = new Set();
        for (let i = 0; i < registrationData.teamMembers.length; i++) {
          const member = registrationData.teamMembers[i];
          if (!member.name || !member.email) {
            throw new Error(
              `Please fill in name and email for team member ${i + 1}`
            );
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(member.email)) {
            throw new Error(
              `Please enter a valid email address for team member ${i + 1}`
            );
          }

          const email = member.email.toLowerCase();
          if (emails.has(email)) {
            throw new Error(
              'Each team member must have a unique email address'
            );
          }
          emails.add(email);

          // Check if email already registered
          const { data: existingReg } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('event_id', params.id)
            .or(
              `participant_details->email.eq.${email},team_members->email.cs.{${email}}`
            )
            .maybeSingle();

          if (existingReg) {
            throw new Error(
              `The email address ${member.email} has already been used to register for this event`
            );
          }
        }
      }

      // Check if event is still open and has capacity
      const { data: currentEvent, error: eventError } = await supabase
        .from('events')
        .select('current_participants, max_participants, registration_deadline')
        .eq('id', params.id)
        .single();

      if (eventError) throw eventError;

      const now = new Date();
      const deadline = new Date(currentEvent.registration_deadline);
      if (now > deadline) {
        throw new Error('Registration deadline has passed');
      }

      if (
        currentEvent.max_participants &&
        currentEvent.current_participants >= currentEvent.max_participants
      ) {
        throw new Error('Event is full');
      }

      // Ensure user is logged in
      if (!user) {
        throw new Error('You must be logged in to register for events');
      }

      // Create registration record
      const registrationPayload = {
        event_id: params.id,
        user_id: user.id,
        team_name:
          event.team_size !== 'solo' ? registrationData.teamName : null,
        status: 'registered', // Using the correct enum value from database
        registration_data: {
          registration_type: event.team_size,
          participant_details:
            event.team_size === 'solo'
              ? {
                  name: registrationData.teamMembers[0].name.trim(),
                  email: registrationData.teamMembers[0].email
                    .trim()
                    .toLowerCase(),
                  phone: registrationData.teamMembers[0].phone.trim(),
                  college: registrationData.teamMembers[0].college.trim(),
                  year: registrationData.teamMembers[0].year.trim(),
                  gender: registrationData.teamMembers[0].gender.trim(),
                  skills: registrationData.participantSkills?.trim(),
                  experience: registrationData.participantExperience?.trim(),
                }
              : null,
          team_members:
            event.team_size !== 'solo'
              ? registrationData.teamMembers.map((member) => ({
                  name: member.name.trim(),
                  email: member.email.trim().toLowerCase(),
                  phone: member.phone?.trim(),
                  college: member.college?.trim(),
                  year: member.year?.trim(),
                  branch: member.branch?.trim(),
                  gender: member.gender?.trim(),
                }))
              : null,
          additional_info: {
            dietaryRestrictions: registrationData.dietaryRestrictions?.trim(),
            branch: registrationData.branch?.trim(),
            custom_responses: customAnswers,
          },
        },
      };

      const participantCount = event.team_size === 'solo'
        ? 1
        : registrationData.teamMembers.length;

      // Call database atomic function register_for_event via RPC
      const { data: newRegistration, error: registrationError } = await supabase
        .rpc('register_for_event', {
          p_event_id: params.id,
          p_user_id: user.id,
          p_team_name: event.team_size !== 'solo' ? registrationData.teamName : null,
          p_registration_data: registrationPayload.registration_data,
          p_participant_count: participantCount
        });

      if (registrationError) {
        console.error('Registration error:', registrationError);
        throw new Error(
          registrationError.message || 'Failed to save registration'
        );
      }

      if (!newRegistration) {
        throw new Error('Registration data not saved properly');
      }

      // Log successful registration
      console.log('Registration saved successfully');

      // Update UI state
      setRegistrationStatus('success');
      setSuccessMessage(
        'Registration completed successfully! You will receive a confirmation email shortly.'
      );
      setIsRegistered(true);
      setShowRegistrationDialog(false);

      // Refresh event data to show updated participant count
      await fetchEventDetails();
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Registration failed'
      );
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDeadlineUrgency = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0)
      return {
        level: 'expired',
        color: 'text-red-600',
        text: 'Registration Closed',
      };
    if (diffDays <= 1)
      return {
        level: 'critical',
        color: 'text-red-600',
        text: 'Closes Today!',
      };
    if (diffDays <= 3)
      return {
        level: 'high',
        color: 'text-orange-600',
        text: `${diffDays} days left`,
      };
    if (diffDays <= 7)
      return {
        level: 'medium',
        color: 'text-yellow-600',
        text: `${diffDays} days left`,
      };
    return {
      level: 'low',
      color: 'text-green-600',
      text: `${diffDays} days left`,
    };
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'online':
        return <Globe className="h-5 w-5" />;
      case 'offline':
        return <MapPin className="h-5 w-5" />;
      case 'hybrid':
        return <Monitor className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getTeamSizeDisplay = (teamSize: string) => {
    switch (teamSize) {
      case 'solo':
        return 'Individual Participation';
      case '2_people':
        return 'Team of 2 People';
      case 'group_4':
      case 'group_4+':
        return 'Team of 4 People';
      default:
        return 'Individual Participation';
    }
  };

  const getParticipationBadge = (teamSize: string) => {
    switch (teamSize) {
      case 'solo':
        return (
          <Badge className="inline-flex w-fit bg-indigo-50 hover:bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold px-2.5 py-1 text-xs rounded-lg items-center gap-1.5 shadow-none shrink-0">
            <User className="h-3.5 w-3.5 text-indigo-600" />
            <span>Individual (Solo)</span>
          </Badge>
        );
      case '2_people':
        return (
          <Badge className="inline-flex w-fit bg-purple-50 hover:bg-purple-50 text-purple-700 border border-purple-200/80 font-bold px-2.5 py-1 text-xs rounded-lg items-center gap-1.5 shadow-none shrink-0">
            <Users className="h-3.5 w-3.5 text-purple-600" />
            <span>Team of 2</span>
          </Badge>
        );
      case 'group_4':
      case 'group_4+':
        return (
          <Badge className="inline-flex w-fit bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-200/80 font-bold px-2.5 py-1 text-xs rounded-lg items-center gap-1.5 shadow-none shrink-0">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Team of 4</span>
          </Badge>
        );
      default:
        return (
          <Badge className="inline-flex w-fit bg-indigo-50 hover:bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold px-2.5 py-1 text-xs rounded-lg items-center gap-1.5 shadow-none shrink-0">
            <User className="h-3.5 w-3.5 text-indigo-600" />
            <span>Individual (Solo)</span>
          </Badge>
        );
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-2xl p-8">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-2xl border border-black/5 shadow-sm max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1.5">
            Event Not Found
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/dashboard/student/browse">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">
              Back to Browse Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const urgency = getDeadlineUrgency(event.registration_deadline);
  const isRegistrationOpen = urgency.level !== 'expired';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ================= BREADCRUMB & BACK ================= */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/student/browse">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs h-9 px-3.5 shadow-2xs flex items-center gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Browse
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {urgency.level === 'expired' ? (
            <Badge className="bg-slate-900 text-slate-300 border-none text-xs font-bold px-3 py-1 rounded-lg">
              Registration Closed
            </Badge>
          ) : (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {urgency.text}
            </Badge>
          )}
        </div>
      </div>

      {/* ================= HERO HEADER CARD ================= */}
      <div className="relative rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/70 via-purple-50/30 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-bold text-xs px-2.5 py-0.5 rounded-lg capitalize">
              {event.category || 'Campus Event'}
            </Badge>

            <Badge
              className={cn(
                'text-xs font-bold px-2.5 py-0.5 rounded-lg capitalize border-none',
                event.mode === 'online'
                  ? 'bg-blue-600 text-white'
                  : event.mode === 'hybrid'
                  ? 'bg-purple-600 text-white'
                  : 'bg-emerald-600 text-white'
              )}
            >
              {event.mode || 'offline'}
            </Badge>

            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold text-xs px-2.5 py-0.5 rounded-lg capitalize">
              {event.type || 'Activity'}
            </Badge>

            {event.prize_pool && Number(event.prize_pool) > 0 && (
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                ₹{Number(event.prize_pool).toLocaleString()} Prize Pool
              </Badge>
            )}
          </div>

          {/* Event Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {event.title}
          </h1>

          {/* Organizer & College Meta */}
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600 font-medium flex-wrap pt-1">
            {event.club && (
              <div className="flex items-center gap-2">
                {event.club.logo_url ? (
                  <img
                    src={event.club.logo_url}
                    alt={event.club.name}
                    className="w-5 h-5 rounded-md object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                    {event.club.name.charAt(0)}
                  </div>
                )}
                <span>Hosted by <strong className="text-slate-900 font-bold">{event.club.name}</strong></span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold">
              <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>{event.college || event.club?.college || 'DKTE Society\'s TEI'}</span>
            </div>

            {event.venue && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>• {event.venue}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= 2-COLUMN MAIN CONTENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Banner + Tabs) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Poster Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-xs h-48 sm:h-56 w-full group">
            <img
              src={
                event.image_url ||
                `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(event.title)}`
              }
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
            />
          </div>

          {/* Event Details Tabs Card */}
          <Tabs
            defaultValue="overview"
            className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden"
          >
            <div className="border-b border-slate-200/80 px-4 sm:px-6 bg-slate-50/50">
              <TabsList className="bg-transparent h-12 p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="px-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none bg-transparent"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="px-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none bg-transparent"
                >
                  Schedule & Dates
                </TabsTrigger>
                <TabsTrigger
                  value="requirements"
                  className="px-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none bg-transparent"
                >
                  Rules & Requirements
                </TabsTrigger>
                <TabsTrigger
                  value="organizer"
                  className="px-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none shadow-none bg-transparent"
                >
                  Contact & Organizer
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="p-6 sm:p-7 space-y-6 focus-visible:outline-none">
              <div className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  About This Event
                </h2>
                <div className="text-slate-700 leading-relaxed text-sm sm:text-base font-normal">
                  {renderFormattedDescription(event.description)}
                </div>
              </div>

              {/* Key Information Schedule & Participation Cards */}
              <div className="grid sm:grid-cols-2 gap-5 pt-1">
                {/* Event Schedule Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-none">Event Schedule</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Timeline & key dates</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-0.5">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Start Date & Time
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {formatDate(event.start_date)}{' '}
                        <span className="text-indigo-600 font-extrabold ml-1">at {formatTime(event.start_date)}</span>
                      </p>
                    </div>

                    {event.end_date && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          End Date & Time
                        </span>
                        <p className="text-sm font-bold text-slate-900">
                          {formatDate(event.end_date)}{' '}
                          <span className="text-indigo-600 font-extrabold ml-1">at {formatTime(event.end_date)}</span>
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Duration
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {event.duration || 'Full Day Session'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Participation Rules Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-none">Participation Format</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Eligibility & rules</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-0.5">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Team Size
                      </span>
                      <div className="pt-0.5">
                        {getParticipationBadge(event.team_size || 'solo')}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Difficulty Level
                      </span>
                      <div className="pt-0.5">
                        <Badge
                          className={cn(
                            'inline-flex w-fit font-bold px-2.5 py-0.5 text-xs rounded-md border-none capitalize shadow-none',
                            event.level === 'advanced'
                              ? 'bg-purple-100 text-purple-700'
                              : event.level === 'intermediate'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          )}
                        >
                          {event.level || 'Beginner'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Seats Available
                      </span>
                      <p className="text-sm font-bold text-slate-900 pt-0.5">
                        {event.current_participants}
                        {event.max_participants && (
                          <span className="text-slate-500 font-semibold"> / {event.max_participants}</span>
                        )}{' '}
                        <span className="text-slate-500 font-normal text-xs ml-1">registered</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Event Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                      >
                        <Tag className="h-3 w-3 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: SCHEDULE & DETAILS */}
            <TabsContent value="details" className="p-6 sm:p-7 space-y-6 focus-visible:outline-none">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    Location & Venue
                  </h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">{event.mode?.toUpperCase()} EVENT</p>
                    <p>{event.venue || 'Main Campus Auditorium'}</p>
                    <p className="text-slate-500">{event.college || 'DKTE Society\'s TEI'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Rewards & Recognition
                  </h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    {event.prize_pool ? (
                      <>
                        <p className="font-bold text-slate-800">Prize Pool: ₹{Number(event.prize_pool).toLocaleString()}</p>
                        <p>Exciting cash prizes and certificates for top finalists!</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-slate-800">Participation Certificates</p>
                        <p>All registered students receive verifiable digital credentials.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: REQUIREMENTS */}
            <TabsContent value="requirements" className="p-6 sm:p-7 space-y-4 focus-visible:outline-none">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                Participation Rules & Prerequisites
              </h2>

              {event.requirements && event.requirements.length > 0 ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2.5">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase">Requirements Checklist</h3>
                  <ul className="space-y-2 text-xs text-indigo-950 font-medium">
                    {event.requirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs text-emerald-900 font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>No prerequisites required. This event is open to all eligible students!</span>
                </div>
              )}
            </TabsContent>

            {/* TAB 4: ORGANIZER */}
            <TabsContent value="organizer" className="p-6 sm:p-7 space-y-4 focus-visible:outline-none">
              <h2 className="text-base font-bold text-slate-900">Host Society Information</h2>
              {event.club ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {event.club.logo_url ? (
                      <img
                        src={event.club.logo_url}
                        alt={event.club.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center">
                        {event.club.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{event.club.name}</h3>
                      <p className="text-xs text-slate-500">{event.club.category || 'Student Chapter'}</p>
                    </div>
                  </div>

                  {event.contact_info && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-600 font-medium">
                      {event.contact_info.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <a href={`mailto:${event.contact_info.email}`} className="text-indigo-600 hover:underline">
                            {event.contact_info.email}
                          </a>
                        </div>
                      )}
                      {event.contact_info.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <a href={`tel:${event.contact_info.phone}`} className="text-indigo-600 hover:underline">
                            {event.contact_info.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Organized by Campus Activities Committee.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (Sticky Action Sidebar) */}
        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            {/* Primary Action Card */}
            <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Price & Action Header */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {event.entry_fee > 0 ? `₹${event.entry_fee}` : 'Free Entry'}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl h-8 w-8"
                      title="Bookmark event"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl h-8 w-8"
                      title="Share event"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Status Messages */}
                {registrationStatus === 'success' && (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs py-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <AlertDescription>{successMessage || "Registered successfully!"}</AlertDescription>
                  </Alert>
                )}

                {registrationStatus === 'error' && (
                  <Alert className="border-rose-200 bg-rose-50 text-rose-800 text-xs py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Main CTA Button */}
                {isRegistrationOpen ? (
                  <Button
                    onClick={handleRegistration}
                    disabled={registering || isRegistered}
                    className={cn(
                      'w-full h-11 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all',
                      isRegistered
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    )}
                  >
                    {isRegistered ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Registered
                      </span>
                    ) : event.team_size === 'solo' ? (
                      'Register for Event'
                    ) : (
                      'Register Team'
                    )}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 text-slate-400 border border-slate-200 shadow-none"
                  >
                    Registration Closed
                  </Button>
                )}

                {/* Metrics Breakdown */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Live Views</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {(event.views ?? 1).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Slots Filled</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                        {event.current_participants}
                        {event.max_participants ? (
                          <span className="text-xs font-normal text-slate-400">/{event.max_participants}</span>
                        ) : (
                          <span className="text-xs font-normal text-slate-400 ml-0.5">joined</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Perks Card */}
            <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Event Perks & Highlights
                </h3>
              </div>
              <CardContent className="p-4 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                  <span>Digital Certificate Included</span>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </div>
                  <span>Instant QR Attendance Check-In</span>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                  <span>Live Leaderboard & Standings</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <User className="h-6 w-6 mr-2 text-indigo-600" />
              {event?.team_size === 'solo'
                ? 'Register for Event'
                : 'Team Registration'}
            </DialogTitle>
            <DialogDescription>
              {event?.team_size === 'solo'
                ? 'Fill in your details to register for this event'
                : `Create your team of ${getTeamSizeDisplay(event?.team_size || 'solo').toLowerCase()} and register`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Messages */}
            {registrationStatus === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {event?.team_size === 'solo' ? (
              // Solo Registration Form
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={registrationData.teamMembers[0]?.name || ''}
                      onChange={(e) =>
                        updateTeamMember(0, 'name', e.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={registrationData.teamMembers[0]?.email || ''}
                      onChange={(e) =>
                        updateTeamMember(0, 'email', e.target.value)
                      }
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={registrationData.teamMembers[0]?.phone || ''}
                      onChange={(e) =>
                        updateTeamMember(0, 'phone', e.target.value)
                      }
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="college">College/University</Label>
                    <CollegeAutocomplete
                      id="college"
                      value={registrationData.teamMembers[0]?.college || ''}
                      onChange={(val) =>
                        updateTeamMember(0, 'college', val)
                      }
                      placeholder="Type to search your college..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year of Study *</Label>
                    <Select
                      value={registrationData.teamMembers[0]?.year || ''}
                      onValueChange={(value) =>
                        updateTeamMember(0, 'year', value)
                      }
                    >
                      <SelectTrigger id="year" className="w-full">
                        <SelectValue placeholder="Select your year of study" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st year">1st Year</SelectItem>
                        <SelectItem value="2nd year">2nd Year</SelectItem>
                        <SelectItem value="3rd year">3rd Year</SelectItem>
                        <SelectItem value="4th year">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={registrationData.teamMembers[0]?.gender || ''}
                      onValueChange={(value) =>
                        updateTeamMember(0, 'gender', value)
                      }
                    >
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={registrationData.branch}
                      onChange={(e) =>
                        setRegistrationData((prev) => ({
                          ...prev,
                          branch: e.target.value,
                        }))
                      }
                      placeholder="Your branch/department"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Team Registration Form
              <div className="space-y-6">
                <div>
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={registrationData.teamName}
                    onChange={(e) =>
                      setRegistrationData((prev) => ({
                        ...prev,
                        teamName: e.target.value,
                      }))
                    }
                    placeholder="Enter your team name"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      Team Members
                    </h3>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {registrationData.teamMembers.map((member, index) => (
                      <Card key={index} className="border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            {index === 0 ? 'Team Leader' : `Member ${index}`}
                          </h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={member.name}
                              onChange={(e) =>
                                updateTeamMember(index, 'name', e.target.value)
                              }
                              placeholder="Full name"
                              required
                            />
                          </div>
                          <div>
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={member.email}
                              onChange={(e) =>
                                updateTeamMember(index, 'email', e.target.value)
                              }
                              placeholder="Email address"
                              required
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={member.phone}
                              onChange={(e) =>
                                updateTeamMember(index, 'phone', e.target.value)
                              }
                              placeholder="Phone number"
                            />
                          </div>
                          <div>
                            <Label>College</Label>
                            <CollegeAutocomplete
                              value={member.college}
                              onChange={(val) =>
                                updateTeamMember(
                                  index,
                                  'college',
                                  val
                                )
                              }
                              placeholder="Type to search college..."
                            />
                          </div>
                          <div>
                            <Label>Branch/Department</Label>
                            <Input
                              value={member.branch}
                              onChange={(e) =>
                                updateTeamMember(
                                  index,
                                  'branch',
                                  e.target.value
                                )
                              }
                              placeholder="e.g., Computer Science"
                            />
                          </div>
                          <div>
                            <Label>Year of Study *</Label>
                            <Select
                              value={member.year}
                              onValueChange={(value) =>
                                updateTeamMember(index, 'year', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1st year">
                                  1st Year
                                </SelectItem>
                                <SelectItem value="2nd year">
                                  2nd Year
                                </SelectItem>
                                <SelectItem value="3rd year">
                                  3rd Year
                                </SelectItem>
                                <SelectItem value="4th year">
                                  4th Year
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Gender *</Label>
                            <Select
                              value={member.gender}
                              onValueChange={(value) =>
                                updateTeamMember(index, 'gender', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Custom Questions (Google Forms style) */}
            {event?.contact_info?.custom_questions && event.contact_info.custom_questions.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  Additional Information Required
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {event.contact_info.custom_questions.map((q: any) => (
                    <div key={q.id} className="space-y-1">
                      <Label htmlFor={`custom-${q.id}`} className="text-sm font-semibold text-slate-700">
                        {q.label} {q.required && <span className="text-red-500">*</span>}
                      </Label>
                      {q.type === 'select' ? (
                        <Select
                          value={customAnswers[q.id] || ''}
                          onValueChange={(val) => setCustomAnswers(prev => ({ ...prev, [q.id]: val }))}
                        >
                          <SelectTrigger id={`custom-${q.id}`} className="w-full border-slate-200 focus:ring-indigo-500 rounded-xl">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {q.options?.map((opt: string) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : q.type === 'checkbox' ? (
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="checkbox"
                            id={`custom-${q.id}`}
                            checked={customAnswers[q.id] === 'true'}
                            onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.checked ? 'true' : 'false' }))}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <Label htmlFor={`custom-${q.id}`} className="text-sm text-slate-600 cursor-pointer">{q.label}</Label>
                        </div>
                      ) : (
                        <Input
                          id={`custom-${q.id}`}
                          type={q.type === 'number' ? 'number' : 'text'}
                          value={customAnswers[q.id] || ''}
                          onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder={`Enter details`}
                          required={q.required}
                          className="border-slate-200 rounded-xl focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegistrationDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRegistration}
                disabled={registering}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {registering ? 'Registering...' : 'Complete Registration'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
