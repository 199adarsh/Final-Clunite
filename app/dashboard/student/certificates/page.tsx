'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Award,
  Download,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building2,
  Copy,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { CertificateCanvas, CertificateCanvasRef } from '@/components/certificates/certificate-canvas';
import { generateDefaultCertificateSVG } from '@/components/certificates/default-template';

interface StudentCertificate {
  id: string;
  certificate_code: string;
  recipient_name: string;
  issued_at: string;
  event_title: string;
  club_name: string;
  template_url?: string;
  template_config?: any;
}

export default function StudentCertificatesPage() {
  const { user: authUser } = useAuth();
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCert, setSelectedCert] = useState<StudentCertificate | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const modalCanvasRef = useRef<CertificateCanvasRef>(null);

  useEffect(() => {
    fetchStudentCertificates();
  }, [authUser]);

  const fetchStudentCertificates = async () => {
    if (!authUser) return;
    setLoading(true);

    try {
      const certList: StudentCertificate[] = [];

      // 1. Fetch explicitly issued certificates via server API route (reliable across all envs)
      try {
        const res = await fetch(
          `/api/certificates?userId=${authUser.id}&email=${encodeURIComponent(authUser.email || '')}`
        );
        const json = await res.json();
        const explicitCerts = json.data || [];

        if (explicitCerts.length > 0) {
          explicitCerts.forEach((c: any) => {
            certList.push({
              id: c.id,
              certificate_code: c.certificate_code,
              recipient_name: c.recipient_name,
              issued_at: c.issued_at,
              event_title: c.event_title || 'Campus Event',
              club_name: c.club_name || 'Campus Organization',
              template_url: c.template_url,
              template_config: c.template_config,
            });
          });
        }
      } catch (apiErr) {
        console.warn('API certificates fetch error:', apiErr);
      }

      // 2. Fetch from Local Storage sync layer
      try {
        const localRaw = localStorage.getItem('clunite_issued_certificates');
        if (localRaw) {
          const localList = JSON.parse(localRaw);
          const currentEmail = authUser.email?.toLowerCase();
          const currentUserId = authUser.id;

          localList.forEach((c: any) => {
            const matchesEmail = c.recipient_email && c.recipient_email.toLowerCase() === currentEmail;
            const matchesUser = c.user_id && c.user_id === currentUserId;
            // Also if testing in same browser session
            const matchesAny = matchesEmail || matchesUser;

            const alreadyExists = certList.some(
              (item) => item.certificate_code === c.certificate_code || item.id === c.id
            );

            if (matchesAny && !alreadyExists) {
              certList.push({
                id: c.id,
                certificate_code: c.certificate_code,
                recipient_name: c.recipient_name,
                issued_at: c.issued_at,
                event_title: c.event_title || 'Campus Event',
                club_name: c.club_name || 'Campus Club',
                template_url: c.template_url,
                template_config: c.template_config,
              });
            }
          });
        }
      } catch (localErr) {
        console.warn('Local storage fetch error:', localErr);
      }

      // 3. Also check attended events where certificates are enabled
      try {
        const { data: attendedRegs } = await supabase
          .from('event_registrations')
          .select('id, created_at, event:events(id, title, contact_info, club:clubs(name))')
          .eq('user_id', authUser.id)
          .in('status', ['attended', 'registered']);

        if (attendedRegs) {
          attendedRegs.forEach((r: any) => {
            const isCertEnabled = r.event?.contact_info?.certificates_enabled;
            const alreadyExists = certList.some((c) => c.event_title === r.event?.title);

            if (isCertEnabled && !alreadyExists) {
              certList.push({
                id: r.id,
                certificate_code: `CLU-${r.id.substring(0, 8).toUpperCase()}`,
                recipient_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Student',
                issued_at: r.created_at,
                event_title: r.event?.title || 'Campus Event',
                club_name: r.event?.club?.name || 'Campus Club',
              });
            }
          });
        }
      } catch (regErr) {
        console.warn('Registrations fetch error:', regErr);
      }

      setCertificates(certList);
    } catch (err) {
      console.error('Error fetching student certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadModalPNG = async () => {
    if (!modalCanvasRef.current || !selectedCert) return;
    const dataUrl = await modalCanvasRef.current.exportPNG(1.0);
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Certificate_${selectedCert.event_title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCerts = certificates.filter(
    (c) =>
      c.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certificate_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 sm:px-8 py-6 space-y-6 sm:space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  My Certificates & Credentials
                </h1>
                <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
                  Verified digital credentials earned from campus events, hackathons, and workshops.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-amber-50 text-amber-800 border-amber-200 px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>{certificates.length} Verified Credentials</span>
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by event, club, or certificate ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-black/5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
          </div>
        </div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white/60 rounded-3xl animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-black/5 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Award className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">No Certificates Earned Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Participate in campus events, competitions, and workshops to earn verified digital credentials for your resume.
              </p>
            </div>
            <Link href="/dashboard/student/browse">
              <Button className="rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold px-6">
                Browse Upcoming Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert) => {
              const defaultSvg = generateDefaultCertificateSVG(
                cert.club_name,
                cert.event_title,
                cert.template_config?.role || 'Participant',
                {
                  recipientName: cert.recipient_name,
                  studentCollege: (cert as any).template_config?.studentCollege || (cert as any).student_college || (authUser as any)?.college || "DKTE's Textile and Engineering Institute, Ichalkaranji",
                  teamName: (cert as any).template_config?.teamName || (cert as any).team_name,
                  isTeam: (cert as any).template_config?.isTeam || !!(cert as any).template_config?.teamName || !!(cert as any).team_name,
                  hostCollege: cert.club_name || "DKTE Society's Textile & Engineering Institute",
                }
              );
              const bgUrl = cert.template_url === 'default' || !cert.template_url ? defaultSvg : cert.template_url;

              return (
                <Card
                  key={cert.id}
                  className="bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Certificate Preview Thumbnail */}
                  <div
                    className="relative aspect-[16/9] bg-slate-100 overflow-hidden cursor-pointer"
                    onClick={() => {
                      setSelectedCert(cert);
                      setPreviewOpen(true);
                    }}
                  >
                    <img src={bgUrl} alt={cert.event_title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Button size="sm" className="rounded-full bg-white text-slate-900 font-bold shadow-lg text-xs">
                        View Full Certificate
                      </Button>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-slate-800 border border-slate-200/60 shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>{cert.certificate_code}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {cert.event_title}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>Issued by {cert.club_name}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(cert.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(cert.certificate_code)}
                        className="hover:text-slate-700 font-mono flex items-center gap-1 text-[11px]"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedCode === cert.certificate_code ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-1/2 rounded-full border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setSelectedCert(cert);
                          setPreviewOpen(true);
                        }}
                      >
                        Inspect
                      </Button>

                      <Button
                        size="sm"
                        className="w-1/2 rounded-full bg-slate-950 hover:bg-indigo-600 text-white font-bold text-xs px-4"
                        onClick={() => {
                          setSelectedCert(cert);
                          setPreviewOpen(true);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Screen High-Res Modal Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-4 sm:p-6 bg-white rounded-3xl border-0 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-extrabold text-slate-900">
                {selectedCert?.event_title}
              </DialogTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-xs">
                {selectedCert?.certificate_code}
              </Badge>
            </div>
            <DialogDescription className="text-slate-500 text-xs">
              Issued to {selectedCert?.recipient_name} by {selectedCert?.club_name}
            </DialogDescription>
          </DialogHeader>

          {selectedCert && (
            <div className="space-y-4">
              <CertificateCanvas
                ref={modalCanvasRef}
                templateUrl={
                  selectedCert.template_url === 'default' || !selectedCert.template_url
                    ? generateDefaultCertificateSVG(
                        selectedCert.club_name,
                        selectedCert.event_title,
                        selectedCert.template_config?.role || 'Participant',
                        {
                          recipientName: selectedCert.recipient_name,
                          studentCollege: (selectedCert as any).template_config?.studentCollege || (selectedCert as any).student_college || (authUser as any)?.college || authUser?.user_metadata?.college || "DKTE's Textile and Engineering Institute, Ichalkaranji",
                          teamName: (selectedCert as any).template_config?.teamName || (selectedCert as any).team_name,
                          isTeam: (selectedCert as any).template_config?.isTeam || !!(selectedCert as any).template_config?.teamName || !!(selectedCert as any).team_name,
                          hostCollege: selectedCert.club_name || "DKTE Society's Textile & Engineering Institute",
                          certCode: selectedCert.certificate_code,
                        }
                      )
                    : selectedCert.template_url
                }
                config={{
                  recipientName: selectedCert.recipient_name,
                  fontFamily: selectedCert.template_config?.fontFamily || "'Cinzel', serif",
                  fontSize: selectedCert.template_config?.fontSize || 42,
                  color: selectedCert.template_config?.color || '#0f172a',
                  bold: selectedCert.template_config?.bold ?? true,
                  italic: selectedCert.template_config?.italic || false,
                  align: selectedCert.template_config?.align || 'center',
                  xPercent: selectedCert.template_config?.xPercent || 50.0,
                  yPercent: selectedCert.template_config?.yPercent || 43.0,
                  letterSpacing: selectedCert.template_config?.letterSpacing || 2,
                  uppercase: selectedCert.template_config?.uppercase ?? true,
                  showDate: false,
                  dateText: new Date(selectedCert.issued_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  dateXPercent: selectedCert.template_config?.dateXPercent || 50.0,
                  dateYPercent: selectedCert.template_config?.dateYPercent || 67.0,
                  dateFontSize: selectedCert.template_config?.dateFontSize || 16,
                  dateColor: selectedCert.template_config?.dateColor || '#475569',
                  showCertCode: false,
                  certCodeText: selectedCert.certificate_code,
                  certCodeXPercent: selectedCert.template_config?.certCodeXPercent || 50.0,
                  certCodeYPercent: selectedCert.template_config?.certCodeYPercent || 94.5,
                  certCodeFontSize: selectedCert.template_config?.certCodeFontSize || 12,
                  certCodeColor: selectedCert.template_config?.certCodeColor || '#94a3b8',
                }}
                showGuides={false}
                readOnly={true}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Verified Clunite Digital Credential • 300 DPI Print Ready
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-slate-200 font-bold text-xs"
                    onClick={() => handleCopyCode(selectedCert.certificate_code)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    {copiedCode === selectedCert.certificate_code ? 'Copied' : 'Copy Code'}
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-6 shadow-md"
                    onClick={handleDownloadModalPNG}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download PNG
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
