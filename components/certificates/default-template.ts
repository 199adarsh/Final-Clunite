/**
 * High-Resolution Ornate Gold/Amber Certificate Template
 * Scaled for 1920x1080 (16:9) print & digital verification.
 * Features:
 * - Ornate Gold & Amber borders and corner flourishes
 * - Enhanced larger, high-contrast typography
 * - Automatic Team vs. Individual phrasing (with student college, team name, host org, and category)
 * - Signatures removed for clean modern layout
 * - Official Clunite Golden Verification Medallion / Stamp
 * - Proportional spacing with zero overlapping
 */

export interface CertificateOptions {
  recipientName?: string;
  studentCollege?: string;
  teamName?: string;
  hostCollege?: string;
  category?: string;
  isTeam?: boolean;
  issueDate?: string;
  certCode?: string;
}

export function generateDefaultCertificateSVG(
  clubName = 'DKTE Society\'s TEI',
  eventTitle = 'Campus Hackathon 2026',
  role: string = 'Participant',
  options: CertificateOptions = {}
): string {
  // Normalize role
  const is1st = role.toLowerCase().includes('1st') || role.toLowerCase().includes('winner');
  const is2nd = role.toLowerCase().includes('2nd') || role.toLowerCase().includes('runner');
  const is3rd = role.toLowerCase().includes('3rd');
  const isSpecial = role.toLowerCase().includes('special') || role.toLowerCase().includes('merit');

  let certHeader = 'CERTIFICATE OF PARTICIPATION';
  let verbPhrase = 'has actively participated in';
  let badgeText = '';
  let badgeGradient = 'url(#goldGrad)';
  let sealTier = 'PARTICIPANT';

  if (is1st) {
    certHeader = 'CERTIFICATE OF EXCELLENCE';
    verbPhrase = 'has secured 1st Place Winner in';
    badgeText = '★ FIRST PLACE WINNER ★';
    badgeGradient = 'url(#goldGrad)';
    sealTier = '1ST PLACE GOLD';
  } else if (is2nd) {
    certHeader = 'CERTIFICATE OF MERIT';
    verbPhrase = 'has secured 1st Runner Up in';
    badgeText = '★ 2ND PLACE — 1ST RUNNER UP ★';
    badgeGradient = 'url(#silverGrad)';
    sealTier = '2ND PLACE SILVER';
  } else if (is3rd) {
    certHeader = 'CERTIFICATE OF ACHIEVEMENT';
    verbPhrase = 'has secured 2nd Runner Up in';
    badgeText = '★ 3RD PLACE — 2ND RUNNER UP ★';
    badgeGradient = 'url(#bronzeGrad)';
    sealTier = '3RD PLACE BRONZE';
  } else if (isSpecial) {
    certHeader = 'CERTIFICATE OF SPECIAL MERIT';
    verbPhrase = 'has been awarded Special Recognition in';
    badgeText = '★ SPECIAL RECOGNITION ★';
    sealTier = 'SPECIAL MERIT';
  }

  const studentCollege = options.studentCollege || 'DKTE\'s Textile and Engineering Institute, Ichalkaranji';
  const teamName = options.teamName?.trim();
  const isTeam = options.isTeam || (teamName && teamName.length > 0);
  const hostCollege = options.hostCollege || clubName || 'DKTE Society\'s Textile & Engineering Institute';
  const issueDate = options.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const certCode = options.certCode || 'CLU-2026-VERIFIED';

  // Construct description lines matching the clean Unstop layout with prominent, enlarged font styling
  const line1 = isTeam
    ? `from <tspan font-weight="800" fill="#0f172a">${escapeXml(studentCollege)}</tspan> as Team <tspan font-weight="800" fill="#9a3412">${escapeXml(teamName || 'Invictus')}</tspan>`
    : `from <tspan font-weight="800" fill="#0f172a">${escapeXml(studentCollege)}</tspan>`;

  const line2 = `${verbPhrase} <tspan font-weight="800" fill="#0f172a">${escapeXml(eventTitle)}</tspan>`;
  const line3 = `organised by <tspan font-weight="800" fill="#0f172a">${escapeXml(hostCollege)}</tspan>.`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#fffbf5"/>
        <stop offset="100%" stop-color="#fdf6ec"/>
      </linearGradient>

      <!-- Warm Amber/Gold Gradient -->
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b45309"/>
        <stop offset="25%" stop-color="#d97706"/>
        <stop offset="50%" stop-color="#f59e0b"/>
        <stop offset="75%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>

      <!-- Silver Gradient -->
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="35%" stop-color="#cbd5e1"/>
        <stop offset="70%" stop-color="#94a3b8"/>
        <stop offset="100%" stop-color="#334155"/>
      </linearGradient>

      <!-- Bronze Gradient -->
      <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c2d12"/>
        <stop offset="35%" stop-color="#d97706"/>
        <stop offset="70%" stop-color="#b45309"/>
        <stop offset="100%" stop-color="#431407"/>
      </linearGradient>
    </defs>

    <!-- Canvas Background -->
    <rect width="1920" height="1080" fill="url(#bgGrad)" />

    <!-- Ornate Outer Gold Borders -->
    <rect x="36" y="36" width="1848" height="1008" rx="16" fill="none" stroke="${is2nd ? 'url(#silverGrad)' : is3rd ? 'url(#bronzeGrad)' : 'url(#goldGrad)'}" stroke-width="5" />
    <rect x="50" y="50" width="1820" height="980" rx="12" fill="none" stroke="#0f172a" stroke-width="1.5" />
    <rect x="60" y="60" width="1800" height="960" rx="8" fill="none" stroke="${is2nd ? 'url(#silverGrad)' : is3rd ? 'url(#bronzeGrad)' : 'url(#goldGrad)'}" stroke-width="1.5" stroke-dasharray="8 6" />

    <!-- Ornate Corner Flourishes -->
    <g fill="${is2nd ? 'url(#silverGrad)' : is3rd ? 'url(#bronzeGrad)' : 'url(#goldGrad)'}">
      <!-- Top Left -->
      <path d="M 36 140 L 36 36 L 140 36 Q 88 88 36 140 Z" opacity="0.9"/>
      <circle cx="85" cy="85" r="7" fill="#b45309"/>
      <!-- Top Right -->
      <path d="M 1884 140 L 1884 36 L 1780 36 Q 1832 88 1884 140 Z" opacity="0.9"/>
      <circle cx="1835" cy="85" r="7" fill="#b45309"/>
      <!-- Bottom Left -->
      <path d="M 36 940 L 36 1044 L 140 1044 Q 88 992 36 940 Z" opacity="0.9"/>
      <circle cx="85" cy="995" r="7" fill="#b45309"/>
      <!-- Bottom Right -->
      <path d="M 1884 940 L 1884 1044 L 1780 1044 Q 1832 992 1884 940 Z" opacity="0.9"/>
      <circle cx="1835" cy="995" r="7" fill="#b45309"/>
    </g>

    <!-- ================= TOP HEADER BRANDING ================= -->
    <!-- Host Club / Institution Heading -->
    <g transform="translate(960, 125)" text-anchor="middle">
      <text font-family="'Cinzel', serif" font-size="21" font-weight="700" fill="#b45309" letter-spacing="8">
        ${escapeXml(hostCollege.toUpperCase())}
      </text>
    </g>

    <!-- Main Certificate Header Title -->
    <g transform="translate(960, 205)" text-anchor="middle">
      <text font-family="'Cinzel Decorative', 'Cinzel', serif" font-size="46" font-weight="800" fill="#0f172a" letter-spacing="4">
        ${escapeXml(certHeader)}
      </text>
      <line x1="-270" y1="24" x2="270" y2="24" stroke="${is2nd ? 'url(#silverGrad)' : is3rd ? 'url(#bronzeGrad)' : 'url(#goldGrad)'}" stroke-width="2.5" />
      <polygon points="0,19 6,24 0,29 -6,24" fill="#d97706" />
    </g>

    <!-- Optional Placement Banner Badge (e.g. 1st Place Winner) -->
    ${
      badgeText
        ? `<g transform="translate(960, 268)" text-anchor="middle">
            <rect x="-180" y="-16" width="360" height="32" rx="16" fill="${badgeGradient}" />
            <text y="5" font-family="'Inter', sans-serif" font-size="13" font-weight="800" fill="#ffffff" letter-spacing="2">
              ${escapeXml(badgeText)}
            </text>
          </g>`
        : ''
    }

    <!-- Subtitle Presentation Text -->
    <g transform="translate(960, ${badgeText ? 320 : 295})" text-anchor="middle">
      <text font-family="'Playfair Display', serif" font-size="24" font-style="italic" fill="#64748b">
        This is to certify that
      </text>
    </g>

    <!-- (Recipient Name is drawn centered at Y ≈ 395px with 50px buffer) -->

    <!-- ================= DETAILED BODY PHRASING (ENLARGED & READABLE) ================= -->
    <g transform="translate(960, 505)" text-anchor="middle">
      <!-- Line 1: College & Team -->
      <text y="0" font-family="'Inter', -apple-system, sans-serif" font-size="26" font-weight="500" fill="#334155" text-anchor="middle">
        ${line1}
      </text>

      <!-- Line 2: Action & Event Title -->
      <text y="48" font-family="'Inter', -apple-system, sans-serif" font-size="26" font-weight="500" fill="#334155" text-anchor="middle">
        ${line2}
      </text>

      <!-- Line 3: Host Institution -->
      <text y="96" font-family="'Inter', -apple-system, sans-serif" font-size="24" font-weight="500" fill="#475569" text-anchor="middle">
        ${line3}
      </text>
    </g>

    <!-- ================= OFFICIAL VERIFICATION STAMP / MEDALLION ================= -->
    <g transform="translate(960, 755)">
      <!-- Outer Sunburst / Serrated Medal Ring -->
      <circle cx="0" cy="0" r="54" fill="${is2nd ? 'url(#silverGrad)' : is3rd ? 'url(#bronzeGrad)' : 'url(#goldGrad)'}" />
      <circle cx="0" cy="0" r="47" fill="#ffffff" />
      <circle cx="0" cy="0" r="43" fill="#0f172a" />
      <circle cx="0" cy="0" r="39" fill="none" stroke="${is2nd ? 'url(#silverGrad)' : is3rd ? 'url(#bronzeGrad)' : 'url(#goldGrad)'}" stroke-width="1.5" stroke-dasharray="4 3" />

      <!-- Seal Inner Typography -->
      <text y="-16" font-family="'Cinzel', serif" font-size="8" font-weight="800" fill="#fbbf24" text-anchor="middle" letter-spacing="2">
        ★ CLUNITE ★
      </text>
      <text y="-2" font-family="'Inter', sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        VERIFIED
      </text>
      <text y="12" font-family="'Cinzel', serif" font-size="7.5" font-weight="700" fill="#fbbf24" text-anchor="middle" letter-spacing="1.5">
        ${escapeXml(sealTier)}
      </text>
      <text y="24" font-family="'Inter', monospace" font-size="6.5" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="1">
        OFFICIAL SEAL
      </text>
    </g>

    <!-- ================= METADATA & VERIFICATION FOOTER ================= -->
    <!-- Issue Date (Left) -->
    <g transform="translate(200, 910)" text-anchor="start">
      <text font-family="'Inter', sans-serif" font-size="12" font-weight="800" fill="#78350f" letter-spacing="1.5">
        DATE OF ISSUANCE
      </text>
      <text y="26" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="#0f172a">
        ${escapeXml(issueDate)}
      </text>
    </g>

    <!-- Verification URL & Security (Center) -->
    <g transform="translate(960, 975)" text-anchor="middle">
      <text font-family="'Inter', monospace" font-size="12" font-weight="700" fill="#475569" letter-spacing="2">
        VERIFIABLE AT CLUNITE.COM/VERIFY
      </text>
      <text y="20" font-family="'Inter', sans-serif" font-size="11" font-weight="500" fill="#94a3b8">
        Cryptographically signed &amp; stored on immutable campus ledger
      </text>
    </g>

    <!-- Certificate ID (Right) -->
    <g transform="translate(1720, 910)" text-anchor="end">
      <text font-family="'Inter', sans-serif" font-size="12" font-weight="800" fill="#78350f" letter-spacing="1.5">
        CREDENTIAL ID
      </text>
      <text y="26" font-family="'Inter', monospace" font-size="18" font-weight="800" fill="#b45309">
        ${escapeXml(certCode)}
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
