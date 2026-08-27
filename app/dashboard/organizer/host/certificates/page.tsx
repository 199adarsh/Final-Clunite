'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Award,
  ArrowLeft,
  Upload,
  Sparkles,
  Type,
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Crosshair,
  RotateCcw,
  Palette,
  Layers,
  Send,
  Trash2,
  FileCheck,
  Trophy,
  Medal,
  Star,
} from 'lucide-react';
import { CertificateCanvas, CertificateCanvasRef, CertificateConfig } from '@/components/certificates/certificate-canvas';
import { CERTIFICATE_FONTS, PRESET_COLORS, loadCertificateFonts } from '@/components/certificates/fonts';
import { generateDefaultCertificateSVG } from '@/components/certificates/default-template';
import { validateImageFile, parseRecipientsCSV, CSVRecipient, generateCertificateCode, downloadSampleCSV } from '@/lib/certificate-utils';

export default function CertificateStudioPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const canvasRef = useRef<CertificateCanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Club & Events State
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [selectedClubName, setSelectedClubName] = useState<string>('Campus Club');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Template State
  const [templateType, setTemplateType] = useState<'default' | 'custom'>('default');
  const [customTemplateUrl, setCustomTemplateUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Studio Visual Config
  const [activeField, setActiveField] = useState<'name' | 'date' | 'code'>('name');
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [previewRole, setPreviewRole] = useState<string>('Participant');

  const [config, setConfig] = useState<CertificateConfig>({
    recipientName: 'Darshan Chougule',
    fontFamily: "'Cinzel', serif",
    fontSize: 48,
    color: '#0f172a',
    bold: true,
    italic: false,
    align: 'center',
    xPercent: 50.0,
    yPercent: 36.5,
    letterSpacing: 2,
    uppercase: true,

    showDate: false,
    dateText: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    dateXPercent: 18.0,
    dateYPercent: 88.0,
    dateFontSize: 16,
    dateColor: '#0f172a',

    showCertCode: false,
    certCodeText: 'CLU-2026-VERIFIED',
    certCodeXPercent: 82.0,
    certCodeYPercent: 88.0,
    certCodeFontSize: 16,
    certCodeColor: '#b45309',
  });

  // Recipients State (up to 500)
  const [recipients, setRecipients] = useState<CSVRecipient[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isIssuing, setIsIssuing] = useState<boolean>(false);
  const [issuedSuccess, setIssuedSuccess] = useState<boolean>(false);
  const [searchRecipient, setSearchRecipient] = useState<string>('');

  // 1. Initial Load: Automatic Club Detection & Google Fonts
  useEffect(() => {
    loadCertificateFonts();

    // Check Session Storage for already active club
    const sessionClubId = sessionStorage.getItem('selectedClubId');
    const sessionClubName = sessionStorage.getItem('selectedClubName');

    if (sessionClubId && sessionClubName) {
      setSelectedClubId(sessionClubId);
      setSelectedClubName(sessionClubName);
      fetchClubEvents(sessionClubId);
    }

    if (authUser) {
      loadAllUserClubs(sessionClubId);
      const userName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Darshan Chougule';
      setConfig((prev) => ({ ...prev, recipientName: userName }));
    }
  }, [authUser]);

  // Load all user clubs
  const loadAllUserClubs = async (defaultClubId?: string | null) => {
    if (!authUser) return;
    try {
      const { data: memberships } = await supabase
        .from('club_memberships')
        .select('club:clubs(id, name)')
        .eq('user_id', authUser.id);

      const { data: createdClubs } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('created_by', authUser.id);

      const fromMemberships = (memberships || []).map((m: any) => m.club).filter((c: any) => c && c.id);
      const fromCreated = createdClubs || [];
      const combined = [...fromMemberships, ...fromCreated];
      const uniqueClubs = Array.from(new Map(combined.map((c) => [c.id, c])).values());

      setClubs(uniqueClubs);

      if (!defaultClubId && uniqueClubs.length > 0) {
        const initial = uniqueClubs[0];
        setSelectedClubId(initial.id);
        setSelectedClubName(initial.name);
        fetchClubEvents(initial.id);
      }
    } catch (err) {
      console.error('Error fetching clubs:', err);
    }
  };

  // Fetch Events for Selected Club and Load Real Event Registrations
  const fetchClubEvents = async (clubId: string) => {
    try {
      const { data: eventList } = await supabase
        .from('events')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (eventList && eventList.length > 0) {
        setEvents(eventList);
        setSelectedEventId(eventList[0].id);
        setSelectedEvent(eventList[0]);
        if (eventList[0].start_date) {
          const d = new Date(eventList[0].start_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          setConfig((prev) => ({ ...prev, dateText: d }));
        }
        loadEventAttendees(eventList[0].id);
      } else {
        setEvents([]);
        setSelectedEventId('');
        setSelectedEvent(null);
        loadDefaultFallbackAttendee();
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      loadDefaultFallbackAttendee();
    }
  };

  const loadEventAttendees = async (eventId: string) => {
    try {
      const { data: regs } = await supabase
        .from('event_registrations')
        .select('id, user:users(full_name, email), registration_data, status')
        .eq('event_id', eventId);

      if (regs && regs.length > 0) {
        const attendees: CSVRecipient[] = [];
        regs.forEach((r: any, idx: number) => {
          if (r.status === 'cancelled') return;
          if (r.registration_data?.team_members && Array.isArray(r.registration_data.team_members)) {
            r.registration_data.team_members.forEach((m: any, mIdx: number) => {
              attendees.push({
                id: `${r.id}-${mIdx}`,
                name: m.name || `Team Member ${mIdx + 1}`,
                email: m.email || r.user?.email || 'student@dkte.ac.in',
                role: attendees.length === 0 ? '1st Place' : attendees.length === 1 ? '2nd Place' : attendees.length === 2 ? '3rd Place' : 'Participant',
              });
            });
          } else {
            attendees.push({
              id: r.id,
              name: r.user?.full_name || r.registration_data?.participant_name || `Participant ${idx + 1}`,
              email: r.user?.email || 'student@dkte.ac.in',
              role: idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : idx === 2 ? '3rd Place' : 'Participant',
            });
          }
        });

        if (attendees.length > 0) {
          setRecipients(attendees);
          setPreviewRecipient(attendees[0]);
          return;
        }
      }
      loadDefaultFallbackAttendee();
    } catch (err) {
      console.warn('Error loading attendees:', err);
      loadDefaultFallbackAttendee();
    }
  };

  const loadDefaultFallbackAttendee = () => {
    const currentName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Darshan Chougule';
    const currentEmail = authUser?.email || 'darshan.chougule@dkte.ac.in';
    const fallback: CSVRecipient[] = [
      { id: '1', name: currentName, email: currentEmail, role: '1st Place' },
    ];
    setRecipients(fallback);
    setPreviewRecipient(fallback[0]);
  };

  const handleClubChange = (clubId: string) => {
    setSelectedClubId(clubId);
    const club = clubs.find((c) => c.id === clubId);
    if (club) setSelectedClubName(club.name);
    fetchClubEvents(clubId);
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const ev = events.find((e) => e.id === eventId);
    setSelectedEvent(ev || null);
    if (ev?.start_date) {
      const d = new Date(ev.start_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      setConfig((prev) => ({ ...prev, dateText: d }));
    }
    loadEventAttendees(eventId);
  };

  // Auto-generate Default SVG with selected Club, Event Name, and Active Preview Role
  const isSelectedEventTeam = selectedEvent?.team_size === '2_people' || selectedEvent?.team_size === 'group_4' || selectedEvent?.team_size === 'group_4+';
  const defaultTemplateDataUrl = generateDefaultCertificateSVG(
    selectedClubName || 'DKTE Society\'s TEI',
    selectedEvent?.title || 'Campus Hackathon 2026',
    previewRole,
    {
      studentCollege: 'DKTE\'s Textile and Engineering Institute, Ichalkaranji',
      teamName: isSelectedEventTeam ? 'Neuro_Nauts' : undefined,
      isTeam: isSelectedEventTeam,
      hostCollege: selectedClubName || 'DKTE Society\'s Textile & Engineering Institute',
      issueDate: config.dateText,
      certCode: config.certCodeText || 'CLU-2026-PREVIEW',
    }
  );

  const activeTemplateUrl =
    templateType === 'default' ? defaultTemplateDataUrl : customTemplateUrl || defaultTemplateDataUrl;

  // Handle Custom Template Upload
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadingImage(true);

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid image file.');
      setUploadingImage(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomTemplateUrl(event.target?.result as string);
        setTemplateType('custom');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError('Failed to read image file.');
      setUploadingImage(false);
    }
  };

  // Handle CSV Upload
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvErrors([]);
    try {
      const text = await file.text();
      const { recipients: parsed, errors } = parseRecipientsCSV(text);

      if (errors.length > 0) {
        setCsvErrors(errors);
      }

      if (parsed.length > 0) {
        setRecipients(parsed);
        if (parsed[0]) {
          setPreviewRecipient(parsed[0]);
        }
      }
    } catch (err) {
      setCsvErrors(['Failed to parse CSV file.']);
    }
  };

  // 1-Click Import from Attended Registrations
  const handleImportAttended = async () => {
    if (!selectedEventId) return;
    try {
      const { data: regs } = await supabase
        .from('event_registrations')
        .select('id, user:users(full_name, email), status')
        .eq('event_id', selectedEventId);

      if (regs && regs.length > 0) {
        const imported: CSVRecipient[] = regs.map((r: any, idx: number) => ({
          id: r.id || `imp-${idx}`,
          name: r.user?.full_name || `Participant ${idx + 1}`,
          email: r.user?.email || `student${idx + 1}@campus.edu`,
          role: idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : idx === 2 ? '3rd Place' : 'Participant',
        }));
        setRecipients(imported);
        if (imported[0]) {
          setPreviewRecipient(imported[0]);
        }
      } else {
        setCsvErrors(['No registrations found for this event yet.']);
      }
    } catch (err) {
      console.error('Error importing attendees:', err);
    }
  };

  // Set Active Preview Recipient & Synchronize Rank
  const setPreviewRecipient = (recipient: CSVRecipient) => {
    setConfig((prev) => ({ ...prev, recipientName: recipient.name }));
    setPreviewRole(recipient.role || 'Participant');
  };

  // Update Individual Recipient Role (1st, 2nd, 3rd, Participant)
  const updateRecipientRole = (id: string, newRole: string) => {
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          if (config.recipientName === r.name) {
            setPreviewRole(newRole);
          }
          return { ...r, role: newRole };
        }
        return r;
      })
    );
  };

  // Helper to add currently logged in user to recipients
  const handleAddCurrentUser = () => {
    if (!authUser) return;
    const currentName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Organizer Student';
    const currentEmail = authUser.email || 'student@campus.edu';

    // Avoid duplicate if already exists
    if (!recipients.some((r) => r.email.toLowerCase() === currentEmail.toLowerCase())) {
      const newRec: CSVRecipient = {
        id: `user-${Date.now()}`,
        name: currentName,
        email: currentEmail,
        role: '1st Place',
      };
      setRecipients((prev) => [newRec, ...prev]);
      setPreviewRecipient(newRec);
    }
  };

  // Single Certificate Download
  const handleDownloadSingle = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await canvasRef.current.exportPNG(1.0);
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Certificate_${config.recipientName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Issue Certificates to Database and Local Sync Layer
  const handleIssueCertificates = async () => {
    if (recipients.length === 0) return;
    setIsIssuing(true);
    setIssuedSuccess(false);

    try {
      // 1. Fetch users to map user_ids by email
      const { data: allUsers } = await supabase.from('users').select('id, email, full_name');
      const emailToUserId = new Map<string, string>();
      if (allUsers) {
        allUsers.forEach((u) => {
          if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
        });
      }
      if (authUser?.email) {
        emailToUserId.set(authUser.email.toLowerCase(), authUser.id);
      }

      const rows = recipients.map((r) => {
        const matchedUserId = emailToUserId.get(r.email.toLowerCase()) || null;
        return {
          id: `cert-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
          certificate_code: generateCertificateCode(),
          event_id: selectedEventId || null,
          club_id: selectedClubId || null,
          user_id: matchedUserId,
          recipient_name: r.name,
          recipient_email: r.email,
          template_url: templateType === 'custom' ? customTemplateUrl : 'default',
          template_config: { ...config, role: r.role || 'Participant' },
          issued_at: new Date().toISOString(),
          created_by: authUser?.id || null,
          event_title: selectedEvent?.title || 'Campus Event',
          club_name: selectedClubName || 'Campus Club',
        };
      });

      // 2. Insert into Supabase table
      try {
        await (supabase as any).from('issued_certificates').insert(rows);
      } catch (dbErr) {
        console.warn('Supabase insert warning:', dbErr);
      }

      // 3. Save to localStorage sync backup so it immediately appears in student dashboard
      try {
        const existingRaw = localStorage.getItem('clunite_issued_certificates');
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        const merged = [...rows, ...existingList];
        localStorage.setItem('clunite_issued_certificates', JSON.stringify(merged));
      } catch (localErr) {
        console.warn('Local sync warning:', localErr);
      }

      setIssuedSuccess(true);
    } catch (err) {
      console.error('Failed to issue certificates:', err);
    } finally {
      setIsIssuing(false);
    }
  };

  const filteredRecipients = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(searchRecipient.toLowerCase()) ||
      r.email.toLowerCase().includes(searchRecipient.toLowerCase()) ||
      (r.role && r.role.toLowerCase().includes(searchRecipient.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-8 py-6 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Link href="/dashboard/organizer/host">
              <Button
                variant="outline"
                className="border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2 font-semibold text-slate-700 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Event Hub
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Bulk Certificate Studio
                </h1>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2.5 py-0.5 rounded-full text-xs">
                  Pro Studio
                </Badge>
              </div>
              <p className="text-slate-500 font-medium">
                Design verified digital certificates for <span className="font-bold text-slate-800">{selectedClubName}</span> with automatic event synchronization.
              </p>
            </div>
          </div>

          {/* Club & Event Selectors */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Club</Label>
              <Select value={selectedClubId} onValueChange={handleClubChange}>
                <SelectTrigger className="w-[190px] h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold">
                  <SelectValue placeholder="Select Club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Associated Event</Label>
              <Select value={selectedEventId} onValueChange={handleEventChange}>
                <SelectTrigger className="w-[230px] h-11 rounded-xl border-slate-200 bg-slate-50/50 font-semibold">
                  <SelectValue placeholder={events.length === 0 ? "No events found" : "Select Event"} />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main 2-Column Studio Workspace */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Visual Canvas Workspace (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-800">
                    Interactive Canvas ({selectedEvent ? selectedEvent.title : 'Live Preview'})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Field Target Pill Selector */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveField('name')}
                      className={`px-3 py-1 rounded-lg transition ${
                        activeField === 'name' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveField('date')}
                      className={`px-3 py-1 rounded-lg transition ${
                        activeField === 'date' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveField('code')}
                      className={`px-3 py-1 rounded-lg transition ${
                        activeField === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Code
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Switch checked={showGuides} onCheckedChange={setShowGuides} id="guides-toggle" />
                    <Label htmlFor="guides-toggle" className="cursor-pointer text-xs">
                      Guides
                    </Label>
                  </div>
                </div>
              </div>

              {/* The Live Interactive Canvas */}
              <CertificateCanvas
                ref={canvasRef}
                templateUrl={activeTemplateUrl}
                config={config}
                onChangeConfig={(updated) => setConfig((prev) => ({ ...prev, ...updated }))}
                showGuides={showGuides}
                activeField={activeField}
              />

              {/* Quick Placement & Active Recipient Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Active Distinction:</span>
                  <Badge
                    className={`font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1.5 ${
                      previewRole.includes('1st')
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : previewRole.includes('2nd')
                        ? 'bg-slate-200 text-slate-800 border-slate-300'
                        : previewRole.includes('3rd')
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {previewRole.includes('1st') && <Trophy className="h-3 w-3 text-amber-600" />}
                    {previewRole.includes('2nd') && <Medal className="h-3 w-3 text-slate-600" />}
                    {previewRole.includes('3rd') && <Medal className="h-3 w-3 text-amber-700" />}
                    {previewRole}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg border-slate-200"
                    onClick={() => setConfig((prev) => ({ ...prev, xPercent: 50.0, yPercent: 44.5, align: 'center' }))}
                  >
                    Reset Center
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Customization Suites & Tabs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Tabs defaultValue="recipients" className="w-full">
              <TabsList className="grid grid-cols-4 w-full bg-white rounded-2xl p-1.5 border border-black/5 shadow-sm h-12">
                <TabsTrigger value="recipients" className="rounded-xl font-bold text-xs">
                  <Users className="h-3.5 w-3.5 mr-1" /> Winners & Batch
                </TabsTrigger>
                <TabsTrigger value="typography" className="rounded-xl font-bold text-xs">
                  <Type className="h-3.5 w-3.5 mr-1" /> Style
                </TabsTrigger>
                <TabsTrigger value="template" className="rounded-xl font-bold text-xs">
                  <Layers className="h-3.5 w-3.5 mr-1" /> Template
                </TabsTrigger>
                <TabsTrigger value="issue" className="rounded-xl font-bold text-xs">
                  <Send className="h-3.5 w-3.5 mr-1" /> Issue
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Winners & Batch Recipients */}
              <TabsContent value="recipients" className="space-y-6 pt-4">
                <Card className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-6">
                  <div className="space-y-4">
                    {/* Quick Winner Assignment Card */}
                    <div className="p-4 bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-2xl border border-amber-100 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                        <Trophy className="h-4 w-4 text-amber-600" />
                        <span>Quick Podium Selection (1st, 2nd, 3rd Place)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-amber-800 uppercase">1st Place</Label>
                          <Select
                            value={recipients.find((r) => r.role === '1st Place')?.id || ''}
                            onValueChange={(id) => updateRecipientRole(id, '1st Place')}
                          >
                            <SelectTrigger className="h-8 text-[11px] bg-white border-amber-200 rounded-lg">
                              <SelectValue placeholder="Winner" />
                            </SelectTrigger>
                            <SelectContent>
                              {recipients.map((r) => (
                                <SelectItem key={r.id} value={r.id} className="text-xs">
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-700 uppercase">2nd Place</Label>
                          <Select
                            value={recipients.find((r) => r.role === '2nd Place')?.id || ''}
                            onValueChange={(id) => updateRecipientRole(id, '2nd Place')}
                          >
                            <SelectTrigger className="h-8 text-[11px] bg-white border-slate-200 rounded-lg">
                              <SelectValue placeholder="Runner Up" />
                            </SelectTrigger>
                            <SelectContent>
                              {recipients.map((r) => (
                                <SelectItem key={r.id} value={r.id} className="text-xs">
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-amber-900 uppercase">3rd Place</Label>
                          <Select
                            value={recipients.find((r) => r.role === '3rd Place')?.id || ''}
                            onValueChange={(id) => updateRecipientRole(id, '3rd Place')}
                          >
                            <SelectTrigger className="h-8 text-[11px] bg-white border-amber-200 rounded-lg">
                              <SelectValue placeholder="3rd Place" />
                            </SelectTrigger>
                            <SelectContent>
                              {recipients.map((r) => (
                                <SelectItem key={r.id} value={r.id} className="text-xs">
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        All Recipients ({recipients.length} Loaded)
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={downloadSampleCSV}
                        className="text-xs text-indigo-600 font-semibold"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Sample CSV
                      </Button>
                    </div>

                    {/* Action Bar: Import or Upload or Add Myself */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddCurrentUser}
                        className="rounded-xl border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-xs font-bold text-indigo-700 h-10 flex items-center justify-center gap-1"
                        title="Add current logged in account as a recipient"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> + Add Me
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImportAttended}
                        className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 h-10 flex items-center justify-center gap-1"
                      >
                        <Users className="h-3.5 w-3.5 text-indigo-600" /> Attendees
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => csvInputRef.current?.click()}
                        className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 h-10 flex items-center justify-center gap-1"
                      >
                        <Upload className="h-3.5 w-3.5 text-indigo-600" /> CSV
                      </Button>
                      <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                      />
                    </div>

                    {csvErrors.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                        {csvErrors.map((err, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search & Recipients Table */}
                    <div className="space-y-2">
                      <Input
                        placeholder="Search loaded recipients..."
                        value={searchRecipient}
                        onChange={(e) => setSearchRecipient(e.target.value)}
                        className="h-9 text-xs rounded-xl border-slate-200"
                      />

                      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                        {filteredRecipients.map((r) => (
                          <div
                            key={r.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition cursor-pointer ${
                              config.recipientName === r.name
                                ? 'bg-indigo-50/70 border-indigo-200 shadow-sm'
                                : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/60'
                            }`}
                            onClick={() => setPreviewRecipient(r)}
                          >
                            <div className="truncate pr-3 space-y-0.5">
                              <div className="font-bold text-slate-900 text-sm">
                                {r.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium truncate">{r.email}</div>
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={r.role || 'Participant'}
                                onValueChange={(role) => updateRecipientRole(r.id, role)}
                              >
                                <SelectTrigger className="h-7 text-[10px] w-28 rounded-lg bg-white border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Participant">Participant</SelectItem>
                                  <SelectItem value="1st Place">1st Place</SelectItem>
                                  <SelectItem value="2nd Place">2nd Place</SelectItem>
                                  <SelectItem value="3rd Place">3rd Place</SelectItem>
                                  <SelectItem value="Special Recognition">Special Merit</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => setRecipients((prev) => prev.filter((item) => item.id !== r.id))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 2: Typography & Styling */}
              <TabsContent value="typography" className="space-y-6 pt-4">
                <Card className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-6">
                  <div className="space-y-4">
                    {/* Font Dropdown with LIVE TYPOGRAPHY PREVIEWS */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Calligraphic / Typeface Font
                      </Label>
                      <Select
                        value={config.fontFamily}
                        onValueChange={(fam) => setConfig((prev) => ({ ...prev, fontFamily: fam }))}
                      >
                        <SelectTrigger className="h-12 border-slate-200 rounded-xl bg-slate-50/50">
                          <SelectValue placeholder="Choose Font" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {CERTIFICATE_FONTS.map((font) => (
                            <SelectItem key={font.id} value={font.family} className="py-2.5">
                              <div className="flex items-center justify-between w-full gap-4">
                                <span style={{ fontFamily: font.family, fontSize: '18px' }} className="text-slate-900">
                                  {font.name}
                                </span>
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {font.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Live Sample Preview Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center min-h-[90px] text-center">
                      <span className="text-[11px] font-semibold text-slate-400 mb-1">Live Typeface Preview</span>
                      <span
                        style={{
                          fontFamily: config.fontFamily,
                          color: config.color,
                          fontStyle: config.italic ? 'italic' : 'normal',
                          fontWeight: config.bold ? 'bold' : 'normal',
                        }}
                        className="text-3xl transition-all"
                      >
                        {config.recipientName || 'Sample Recipient'}
                      </span>
                    </div>

                    {/* Font Size Slider (1 - 200 pt) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Font Size (1–200 pt)
                        </Label>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {config.fontSize} pt
                        </span>
                      </div>
                      <Slider
                        value={[config.fontSize]}
                        min={12}
                        max={120}
                        step={1}
                        onValueChange={(val) => setConfig((prev) => ({ ...prev, fontSize: val[0] }))}
                        className="py-2"
                      />
                    </div>

                    {/* Formatting Pills (Bold, Italic, Uppercase) */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={config.bold ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setConfig((prev) => ({ ...prev, bold: !prev.bold }))}
                        className={`rounded-xl font-bold text-xs ${config.bold ? 'bg-indigo-600 text-white' : 'border-slate-200'}`}
                      >
                        B
                      </Button>
                      <Button
                        type="button"
                        variant={config.italic ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setConfig((prev) => ({ ...prev, italic: !prev.italic }))}
                        className={`rounded-xl italic font-serif text-xs ${config.italic ? 'bg-indigo-600 text-white' : 'border-slate-200'}`}
                      >
                        I
                      </Button>
                      <Button
                        type="button"
                        variant={config.uppercase ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setConfig((prev) => ({ ...prev, uppercase: !prev.uppercase }))}
                        className={`rounded-xl uppercase font-mono text-xs ${config.uppercase ? 'bg-indigo-600 text-white' : 'border-slate-200'}`}
                      >
                        Caps
                      </Button>

                      {/* Alignment */}
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden ml-auto">
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, align: 'left' }))}
                          className={`px-2.5 py-1 text-xs font-bold ${config.align === 'left' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                        >
                          L
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, align: 'center' }))}
                          className={`px-2.5 py-1 text-xs font-bold ${config.align === 'center' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                        >
                          C
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, align: 'right' }))}
                          className={`px-2.5 py-1 text-xs font-bold ${config.align === 'right' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                        >
                          R
                        </button>
                      </div>
                    </div>

                    {/* Color Picker & Preset Swatches */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Color Selection
                      </Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setConfig((prev) => ({ ...prev, color: preset.hex }))}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              config.color === preset.hex ? 'scale-125 border-indigo-600 shadow-md' : 'border-white hover:scale-110'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          />
                        ))}
                        <div className="flex items-center gap-2 ml-2">
                          <input
                            type="color"
                            value={config.color}
                            onChange={(e) => setConfig((prev) => ({ ...prev, color: e.target.value }))}
                            className="w-7 h-7 rounded-full cursor-pointer border-0"
                          />
                          <span className="text-xs font-mono font-bold text-slate-600">{config.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 3: Template Selection & Upload */}
              <TabsContent value="template" className="space-y-6 pt-4">
                <Card className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Certificate Background
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTemplateType('default');
                          setCustomTemplateUrl('');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Use Default Template
                      </Button>
                    </div>

                    {/* Upload Custom Background */}
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/40 rounded-2xl p-6 text-center transition-all">
                      <Upload className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800">Upload Custom Template</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports JPG, PNG, GIF, BMP, WebP (up to 10MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="mt-4 rounded-full border-slate-200 bg-white font-semibold text-xs px-5 shadow-sm"
                      >
                        {uploadingImage ? 'Validating headers...' : 'Choose Image File'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleTemplateUpload}
                        className="hidden"
                      />
                    </div>

                    {uploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {templateType === 'custom' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Custom background verified and active.</span>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 4: Issue & Distribution */}
              <TabsContent value="issue" className="space-y-6 pt-4">
                <Card className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Issue & Download Options
                    </Label>

                    {/* Single Sample Download */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-800">Download Preview Certificate</div>
                        <div className="text-xs text-slate-500">Export active preview as high-res 300 DPI PNG</div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleDownloadSingle}
                        className="rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-5 shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download PNG
                      </Button>
                    </div>

                    {/* Batch Distribution to Database */}
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 space-y-3">
                      <div className="space-y-1">
                        <div className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                          Distribute to Student Dashboards
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Saves all {recipients.length} certificates with distinct rank distinctions (1st, 2nd, 3rd Place, or Participation). Certificates will immediately appear on participants' dashboards.
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleIssueCertificates}
                        disabled={isIssuing || recipients.length === 0}
                        className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs py-5 shadow-md"
                      >
                        {isIssuing ? (
                          'Issuing to Participants...'
                        ) : (
                          <>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Issue All {recipients.length} Certificates
                          </>
                        )}
                      </Button>

                      {issuedSuccess && (
                        <div className="p-3 bg-white/80 backdrop-blur rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Successfully issued {recipients.length} certificates! They are now live on student dashboards.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
