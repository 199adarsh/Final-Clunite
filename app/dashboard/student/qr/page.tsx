'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserFromDatabase } from '@/lib/sync-user';
import { getUserAvatarUrl } from '@/lib/avatar-utils';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, Calendar, MapPin, User, CheckCircle2, ChevronRight, Award, Info } from 'lucide-react';

export default function StudentQrPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [certificatesCount, setCertificatesCount] = useState<number>(0);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      router.push('/login');
      return;
    }

    async function loadQrData() {
      try {
        setLoading(true);
        const dbUser = await getUserFromDatabase(authUser!.id);
        setUserData(dbUser);

        // Fetch active registrations
        const { data: regs, error } = await supabase
          .from('event_registrations')
          .select(`
            id,
            status,
            registered_at,
            events(
              id,
              title,
              start_date,
              venue,
              club:clubs(name)
            )
          `)
          .eq('user_id', authUser!.id)
          .neq('status', 'cancelled');

        if (error) {
          console.error('Error fetching registrations:', error);
        } else {
          setTickets(regs || []);
        }

        // Calculate certificates count for Student ID Badge
        const certCodes = new Set<string>();
        if (regs) {
          regs.forEach((r: any) => {
            if (r.status === 'attended' && r.events?.contact_info?.certificates_enabled) {
              certCodes.add(r.id);
            }
          });
        }

        try {
          const { data: explicitCerts } = await (supabase as any)
            .from('issued_certificates')
            .select('id, certificate_code')
            .or(`user_id.eq.${authUser!.id},recipient_email.eq.${authUser!.email}`);
          if (explicitCerts) {
            explicitCerts.forEach((c: any) => certCodes.add(c.certificate_code || c.id));
          }
        } catch (e) {
          console.warn('issued_certificates query warning:', e);
        }

        try {
          const localRaw = localStorage.getItem('clunite_issued_certificates');
          if (localRaw) {
            const localList = JSON.parse(localRaw);
            const currentEmail = authUser?.email?.toLowerCase();
            const currentUserId = authUser?.id;
            localList.forEach((c: any) => {
              if (
                (c.recipient_email && c.recipient_email.toLowerCase() === currentEmail) ||
                (c.user_id && c.user_id === currentUserId)
              ) {
                certCodes.add(c.certificate_code || c.id);
              }
            });
          }
        } catch (e) {
          console.warn('local storage query warning:', e);
        }

        setCertificatesCount(certCodes.size);
      } catch (err) {
        console.error('Error loading QR data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadQrData();
  }, [authUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userDisplayName = userData?.full_name || 'Student';
  const profileQrData = `clunite:profile:${userData?.id || authUser?.id}`;
  const profileQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(profileQrData)}`;

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6 sm:space-y-10">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">QR Center</h1>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold border-blue-200">
              <QrCode className="h-4 w-4 mr-1" /> Scan & Go
            </Badge>
          </div>
          <p className="text-gray-600 mt-2 font-medium text-xs sm:text-sm">
            Access your event entry tickets and personal verification profile badge.
          </p>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <Tabs defaultValue="tickets" className="w-full space-y-6">
        <TabsList className="bg-white border border-black/5 p-1 rounded-xl w-fit">
          <TabsTrigger value="tickets" className="px-6 py-2.5 rounded-lg text-sm font-semibold">
            My Event Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="px-6 py-2.5 rounded-lg text-sm font-semibold">
            Profile Badge
          </TabsTrigger>
        </TabsList>

        {/* TICKETS TAB */}
        <TabsContent value="tickets" className="space-y-6 outline-none">
          {tickets.length === 0 ? (
            <Card className="rounded-2xl border border-black/10 bg-white p-12 text-center max-w-lg mx-auto">
              <CardContent className="space-y-4">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No active tickets</h3>
                <p className="text-muted-foreground text-sm">
                  You are not registered for any upcoming events. Browse events to sign up and get your tickets!
                </p>
                <Button onClick={() => router.push('/dashboard/student/browse')} className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                  Browse Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* TICKETS LIST */}
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-lg font-semibold text-slate-800">Select an entry pass</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tickets.map((ticket) => {
                    const event = ticket.events;
                    const eventDate = event?.start_date ? new Date(event.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'TBA';

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-5 rounded-xl border transition-all cursor-pointer bg-white text-left ${
                          selectedTicket?.id === ticket.id
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                            : 'border-black/5 hover:border-black/10 hover:shadow-sm'
                        }`}
                      >
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <Badge className={`border-none capitalize text-xs ${
                               ticket.status === 'attended'
                                 ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                                 : ticket.status === 'waitlisted'
                                 ? 'bg-amber-50 text-amber-700 hover:bg-amber-50'
                                 : 'bg-blue-50 text-blue-600 hover:bg-blue-50'
                             }`}>
                               {ticket.status === 'attended' ? '✓ Attended' : ticket.status}
                             </Badge>
                             <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h3 className="font-bold text-gray-900 line-clamp-1">{event?.title || 'Untitled Event'}</h3>
                          <p className="text-xs text-muted-foreground">{event?.club?.name || 'Clunite Club'}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-black/5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-blue-500" />
                              {eventDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TICKET DETAIL / QR CONTAINER */}
              <div className="lg:col-span-1">
                {selectedTicket ? (
                  <Card className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-md sticky top-6">
                    <CardHeader className={`text-white p-6 ${selectedTicket.status === 'attended' ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}>
                       <CardTitle className="text-lg font-bold line-clamp-1">{selectedTicket.events?.title}</CardTitle>
                       <CardDescription className="text-white/80 text-xs">
                         {selectedTicket.status === 'attended' ? 'Attendance Verified ✓' : `${selectedTicket.events?.club?.name} Entry Pass`}
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="p-6 text-center space-y-6">
                       {selectedTicket.status === 'attended' ? (
                         <div className="py-6 space-y-4">
                           <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                             <CheckCircle2 className="h-10 w-10" />
                           </div>
                           <div>
                             <h3 className="font-bold text-gray-900 text-xl">Attendance Marked</h3>
                             <p className="text-sm text-muted-foreground mt-1">Your attendance for this event has been recorded by the organizer.</p>
                           </div>
                           <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-left space-y-1">
                             <p className="text-xs font-semibold text-emerald-700">✓ Checked in successfully</p>
                             <p className="text-xs text-muted-foreground">Your QR ticket was scanned and verified at the event entrance.</p>
                           </div>
                         </div>
                       ) : (
                         <>
                           <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 inline-block">
                             <img
                               src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`clunite:reg:${selectedTicket.id}`)}`}
                               alt="Ticket QR Code"
                               className="w-48 h-48 mx-auto"
                             />
                           </div>
                           <div className="space-y-2">
                             <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 w-fit mx-auto px-3 py-1 rounded-full text-xs font-semibold">
                               <CheckCircle2 className="h-4 w-4" /> Valid Entry Ticket
                             </div>
                             <p className="text-xs text-muted-foreground pt-2">
                               Show this QR code to the event coordinator at the entrance to verify your attendance.
                             </p>
                           </div>
                         </>
                       )}
                      <div className="text-left text-xs space-y-2 border-t pt-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Ticket ID:</span>
                          <span className="font-mono text-slate-800">{selectedTicket.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Venue:</span>
                          <span className="text-slate-800 font-semibold">{selectedTicket.events?.venue || 'TBA'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Registered:</span>
                          <span className="text-slate-800">
                            {new Date(selectedTicket.registered_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border border-black/5 bg-slate-50/50 p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                    <QrCode className="h-12 w-12 text-slate-300 animate-pulse mb-3" />
                    <p className="text-slate-500 text-sm font-semibold">Select a ticket to display the entry pass QR code</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="outline-none">
          <div className="max-w-sm mx-auto space-y-4">
            {/* ID Card */}
            <div className="rounded-2xl overflow-hidden shadow-xl border border-black/10 bg-white">
              {/* Card Top - Identity */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-7 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black shadow-lg border-2 border-white/20 shrink-0">
                    {userDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest mb-0.5">Student ID</p>
                    <h2 className="text-xl font-black leading-tight truncate">{userDisplayName}</h2>
                    <p className="text-slate-300 text-xs truncate">{userData?.email || ''}</p>
                    <p className="text-slate-400 text-[11px] mt-1 truncate">{userData?.college || 'College not set'}</p>
                  </div>
                </div>
                <div className="relative z-10 mt-5 flex gap-3">
                  <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-black">{tickets.length}</p>
                    <p className="text-[10px] text-slate-300 font-medium">Registered</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-black">{tickets.filter((t: any) => t.status === 'attended').length}</p>
                    <p className="text-[10px] text-slate-300 font-medium">Attended</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-amber-300">{certificatesCount}</p>
                    <p className="text-[10px] text-slate-300 font-medium">Certificates</p>
                  </div>
                </div>
              </div>
              {/* Card Bottom - QR */}
              <div className="p-6 flex flex-col items-center gap-4 bg-white">
                <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 shadow-inner inline-block">
                  <img src={profileQrUrl} alt="Profile QR Code" className="w-44 h-44 mx-auto block" />
                </div>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-100">
                    <User className="h-3.5 w-3.5" />
                    Personal Clunite Badge
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 max-w-[220px] mx-auto leading-relaxed">
                    Show this QR to the organizer at any event entrance for instant profile-based check-in.
                  </p>
                </div>
                <div className="w-full border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
                  <span className="font-medium">Clunite Student Badge</span>
                  <span className="font-mono">{(userData?.id || authUser?.id || '').slice(0, 12)}...</span>
                </div>
              </div>
            </div>
            {/* Usage hint */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
              <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">How to use your personal badge</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  If you don&apos;t have your event ticket handy, show this badge to the organizer. They can scan it to check you in using your profile, as long as you&apos;re registered for the event.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
