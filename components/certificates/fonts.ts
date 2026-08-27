export interface CertificateFont {
  id: string;
  name: string;
  family: string;
  category: 'script' | 'serif' | 'sans-serif' | 'display';
  googleFont: string;
}

export const CERTIFICATE_FONTS: CertificateFont[] = [
  // Calligraphic & Script Fonts
  { id: 'great-vibes', name: 'Great Vibes (Calligraphic)', family: "'Great Vibes', cursive", category: 'script', googleFont: 'Great+Vibes' },
  { id: 'alex-brush', name: 'Alex Brush (Elegant Script)', family: "'Alex Brush', cursive", category: 'script', googleFont: 'Alex+Brush' },
  { id: 'dancing-script', name: 'Dancing Script (Fluid Script)', family: "'Dancing Script', cursive", category: 'script', googleFont: 'Dancing+Script:wght@700' },
  { id: 'allura', name: 'Allura (Formal Script)', family: "'Allura', cursive", category: 'script', googleFont: 'Allura' },
  { id: 'pinyon-script', name: 'Pinyon Script (Royal Script)', family: "'Pinyon Script', cursive", category: 'script', googleFont: 'Pinyon+Script' },
  
  // Luxury Serif Fonts
  { id: 'cinzel-decorative', name: 'Cinzel Decorative (Imperial)', family: "'Cinzel Decorative', serif", category: 'serif', googleFont: 'Cinzel+Decorative:wght@700' },
  { id: 'cinzel', name: 'Cinzel (Classical Serif)', family: "'Cinzel', serif", category: 'serif', googleFont: 'Cinzel:wght@600;700' },
  { id: 'playfair', name: 'Playfair Display (Editorial)', family: "'Playfair Display', serif", category: 'serif', googleFont: 'Playfair+Display:ital,wght@0,700;1,700' },
  { id: 'cormorant', name: 'Cormorant Garamond (Prestige)', family: "'Cormorant Garamond', serif", category: 'serif', googleFont: 'Cormorant+Garamond:ital,wght@0,700;1,700' },

  // Clean Modern Sans-Serif Fonts
  { id: 'outfit', name: 'Outfit (Modern Geometric)', family: "'Outfit', sans-serif", category: 'sans-serif', googleFont: 'Outfit:wght@600;700;800' },
  { id: 'montserrat', name: 'Montserrat (Classic Clean)', family: "'Montserrat', sans-serif", category: 'sans-serif', googleFont: 'Montserrat:wght@600;700;800' },
  { id: 'inter', name: 'Inter (High Legibility)', family: "'Inter', sans-serif", category: 'sans-serif', googleFont: 'Inter:wght@600;700;800' },
  { id: 'oswald', name: 'Oswald (Bold Impact)', family: "'Oswald', sans-serif", category: 'display', googleFont: 'Oswald:wght@600;700' },
];

export const PRESET_COLORS = [
  { name: 'Royal Navy', hex: '#0f172a', preview: 'bg-slate-900' },
  { name: 'Imperial Gold', hex: '#b45309', preview: 'bg-amber-700' },
  { name: 'Golden Amber', hex: '#d97706', preview: 'bg-amber-600' },
  { name: 'Deep Indigo', hex: '#4338ca', preview: 'bg-indigo-700' },
  { name: 'Emerald Green', hex: '#047857', preview: 'bg-emerald-700' },
  { name: 'Crimson Red', hex: '#991b1b', preview: 'bg-red-800' },
  { name: 'Pure Charcoal', hex: '#18181b', preview: 'bg-zinc-900' },
];

// Helper to ensure Google Fonts are loaded into the document head
export function loadCertificateFonts() {
  if (typeof window === 'undefined') return;
  const existing = document.getElementById('clunite-cert-fonts');
  if (existing) return;

  const fontQueries = CERTIFICATE_FONTS.map(f => `family=${f.googleFont}`).join('&');
  const link = document.createElement('link');
  link.id = 'clunite-cert-fonts';
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${fontQueries}&display=swap`;
  document.head.appendChild(link);
}
