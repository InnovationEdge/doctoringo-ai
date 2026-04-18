import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DoctorLogo } from './DoctorLogo';
import { useTranslation } from 'src/providers/TranslationProvider';
import { SEO } from './SEO';

const BOOK_ICON = `<path d="M2 3H8C10.2091 3 12 4.79086 12 7V21C12 19.3431 10.6569 18 9 18H2V3Z" stroke="#033C81" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="#033C81" fill-opacity="0.12"/>
  <path d="M22 3H16C13.7909 3 12 4.79086 12 7V21C12 19.3431 13.3431 18 15 18H22V3Z" stroke="#033C81" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="#033C81" fill-opacity="0.12"/>`;

function generateLogoSVG(variant: 'full' | 'icon', theme: 'light' | 'dark'): string {
  const textColor = theme === 'dark' ? '#ececec' : '#1a1a1a';

  if (variant === 'icon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="512" height="512">
  ${BOOK_ICON}
</svg>`;
  }

  // Centered logo + text
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 40" width="960" height="160">
  <g transform="translate(8, 8)">
    <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
      ${BOOK_ICON}
    </svg>
  </g>
  <text x="42" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="500" fill="${textColor}" letter-spacing="-0.5">Doctoringo</text>
</svg>`;
}

function generateCoverSVG(
  width: number,
  height: number,
  theme: 'light' | 'dark',
  subtitle?: string
): string {
  const bg = theme === 'dark' ? '#0a0a0a' : '#ffffff';
  const textColor = theme === 'dark' ? '#ececec' : '#1a1a1a';
  const subtitleColor = theme === 'dark' ? '#666666' : '#8e8e8e';
  const cx = width / 2;
  const cy = height / 2;
  const iconSize = Math.min(width, height) * 0.12;
  const fontSize = Math.min(width, height) * 0.14;
  const subFontSize = Math.min(width, height) * 0.05;
  const gap = iconSize * 0.4;

  // Total width of icon + gap + text (approximate)
  const textWidth = fontSize * 4.5; // approximate for "Doctoringo"
  const totalWidth = iconSize + gap + textWidth;
  const startX = cx - totalWidth / 2;

  const subtitleY = cy + fontSize * 0.35 + subFontSize * 1.2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <g transform="translate(${startX}, ${cy - iconSize / 2})">
    <svg viewBox="0 0 24 24" fill="none" width="${iconSize}" height="${iconSize}">
      ${BOOK_ICON}
    </svg>
  </g>
  <text x="${startX + iconSize + gap}" y="${cy + fontSize * 0.3}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="500" fill="${textColor}" letter-spacing="-1">Doctoringo</text>
  ${subtitle ? `<text x="${cx}" y="${subtitleY}" font-family="system-ui, -apple-system, sans-serif" font-size="${subFontSize}" fill="${subtitleColor}" text-anchor="middle" letter-spacing="0.5">${subtitle}</text>` : ''}
</svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadSVG(svgContent: string, filename: string) {
  downloadBlob(new Blob([svgContent], { type: 'image/svg+xml' }), filename);
}

function downloadPNG(svgContent: string, filename: string, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      downloadBlob(pngBlob, filename);
    }, 'image/png');
  };

  img.src = url;
}

const logoVariants = [
  { id: 'full-light', label: 'Logo + Text (Light)', variant: 'full' as const, theme: 'light' as const, bg: 'bg-white', border: 'border-[#e5e5e5]', svgSize: { w: 960, h: 160 } },
  { id: 'full-dark', label: 'Logo + Text (Dark)', variant: 'full' as const, theme: 'dark' as const, bg: 'bg-[#0a0a0a]', border: 'border-[#2d2d2d]', svgSize: { w: 960, h: 160 } },
  { id: 'icon-light', label: 'Icon Only (Light)', variant: 'icon' as const, theme: 'light' as const, bg: 'bg-white', border: 'border-[#e5e5e5]', svgSize: { w: 512, h: 512 } },
  { id: 'icon-dark', label: 'Icon Only (Dark)', variant: 'icon' as const, theme: 'dark' as const, bg: 'bg-[#0a0a0a]', border: 'border-[#2d2d2d]', svgSize: { w: 512, h: 512 } },
];

const coverVariants = [
  { id: 'linkedin-banner-light', label: 'LinkedIn Banner (Light)', w: 1584, h: 396, theme: 'light' as const, subtitle: 'AI-Powered Legal Intelligence', bg: 'bg-white', border: 'border-[#e5e5e5]' },
  { id: 'linkedin-banner-dark', label: 'LinkedIn Banner (Dark)', w: 1584, h: 396, theme: 'dark' as const, subtitle: 'AI-Powered Legal Intelligence', bg: 'bg-[#0a0a0a]', border: 'border-[#2d2d2d]' },
  { id: 'linkedin-company-light', label: 'LinkedIn Company (Light)', w: 1128, h: 191, theme: 'light' as const, subtitle: '', bg: 'bg-white', border: 'border-[#e5e5e5]' },
  { id: 'linkedin-company-dark', label: 'LinkedIn Company (Dark)', w: 1128, h: 191, theme: 'dark' as const, subtitle: '', bg: 'bg-[#0a0a0a]', border: 'border-[#2d2d2d]' },
  { id: 'og-image-light', label: 'Social Share / OG (Light)', w: 1200, h: 630, theme: 'light' as const, subtitle: 'AI-Powered Legal Intelligence', bg: 'bg-white', border: 'border-[#e5e5e5]' },
  { id: 'og-image-dark', label: 'Social Share / OG (Dark)', w: 1200, h: 630, theme: 'dark' as const, subtitle: 'AI-Powered Legal Intelligence', bg: 'bg-[#0a0a0a]', border: 'border-[#2d2d2d]' },
];

function DownloadButtons({ onSVG, onPNG, onPNG2x }: { onSVG: () => void; onPNG: () => void; onPNG2x: () => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={onSVG} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] text-[12px] font-medium hover:opacity-90 transition-opacity">
        <Download size={12} /> SVG
      </button>
      <button onClick={onPNG} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#2d2d2d] text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <Download size={12} /> PNG
      </button>
      <button onClick={onPNG2x} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#2d2d2d] text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <Download size={12} /> PNG @2x
      </button>
    </div>
  );
}

export function BrandPage() {
  const navigate = useNavigate();
  const { translate } = useTranslation();

  return (
    <div className="min-h-screen bg-[#fcfcf9] dark:bg-[#171717] font-sans">
      <SEO
        title="Brand Assets"
        description="Doctoringo AI brand assets — logos, colors, and guidelines for media and partners."
        url="/brand"
        noindex
      />
      {/* Header */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-center bg-[#fcfcf9]/80 dark:bg-[#171717]/80 backdrop-blur-md border-b border-[#e5e5e5]/50 dark:border-[#2d2d2d]">
        <div className="max-w-4xl w-full flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 p-2 rounded-xl text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="h-5 w-px bg-[#e5e5e0] dark:bg-[#2d2d2d]" />
          <div className="flex items-center gap-3">
            <DoctorLogo className="w-6 h-6" />
            <span className="text-[18px] font-serif font-medium tracking-tight">{translate('brand_assets', 'Brand Assets')}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-20">
          <div className="flex items-center gap-4 mb-6">
            <DoctorLogo className="w-14 h-14" />
            <h1 className="text-[48px] font-serif font-medium tracking-tight text-[#1a1a1a] dark:text-[#ececec]">
              Doctoringo
            </h1>
          </div>
          <p className="text-[#676767] dark:text-[#8e8e8e] text-[17px] max-w-lg">
            {translate('brand_download_desc', 'Download official Doctoringo AI brand assets in SVG and PNG formats.')}
          </p>
        </div>

        {/* Logos Section */}
        <section className="mb-20">
          <h2 className="text-[28px] font-serif font-medium text-[#1a1a1a] dark:text-[#ececec] mb-2 text-center">{translate('brand_logos', 'Logos')}</h2>
          <p className="text-[#8e8e8e] text-[14px] mb-8 text-center">{translate('brand_logos_desc', 'Primary brand marks in light and dark variants')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {logoVariants.map((item) => {
              const svg = generateLogoSVG(item.variant, item.theme);
              return (
                <div key={item.id} className={`rounded-2xl border ${item.border} overflow-hidden`}>
                  <div className={`${item.bg} p-10 flex items-center justify-center min-h-[160px]`}>
                    {item.variant === 'full' ? (
                      <div className="flex items-center gap-3">
                        <DoctorLogo className="w-8 h-8" />
                        <span className={`text-[28px] font-serif font-medium tracking-tight ${item.theme === 'dark' ? 'text-[#ececec]' : 'text-[#1a1a1a]'}`}>
                          Doctoringo
                        </span>
                      </div>
                    ) : (
                      <DoctorLogo className="w-16 h-16" />
                    )}
                  </div>
                  <div className="bg-[#f9f9f8] dark:bg-[#1d1d1b] border-t border-[#e5e5e5] dark:border-[#2d2d2d] p-4">
                    <p className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ececec] mb-3">{item.label}</p>
                    <DownloadButtons
                      onSVG={() => downloadSVG(svg, `knowhow-${item.id}.svg`)}
                      onPNG={() => downloadPNG(svg, `knowhow-${item.id}.png`, item.svgSize.w, item.svgSize.h)}
                      onPNG2x={() => downloadPNG(svg, `knowhow-${item.id}@2x.png`, item.svgSize.w * 2, item.svgSize.h * 2)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cover Images Section */}
        <section className="mb-20">
          <h2 className="text-[28px] font-serif font-medium text-[#1a1a1a] dark:text-[#ececec] mb-2 text-center">{translate('brand_covers', 'Cover Images')}</h2>
          <p className="text-[#8e8e8e] text-[14px] mb-8 text-center">{translate('brand_covers_desc', 'LinkedIn banners, social share images and OG cards')}</p>

          <div className="space-y-6">
            {coverVariants.map((item) => {
              const svg = generateCoverSVG(item.w, item.h, item.theme, item.subtitle || undefined);
              const aspectRatio = item.w / item.h;
              return (
                <div key={item.id} className={`rounded-2xl border ${item.border} overflow-hidden`}>
                  <div className={`${item.bg} flex items-center justify-center`} style={{ aspectRatio: `${aspectRatio}`, maxHeight: 280 }}>
                    <div className="flex items-center gap-3">
                      <DoctorLogo className="w-8 h-8" />
                      <span className={`text-[24px] font-serif font-medium tracking-tight ${item.theme === 'dark' ? 'text-[#ececec]' : 'text-[#1a1a1a]'}`}>
                        Doctoringo
                      </span>
                    </div>
                    {item.subtitle && (
                      <span className={`absolute mt-16 text-[12px] ${item.theme === 'dark' ? 'text-[#666]' : 'text-[#8e8e8e]'}`}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  <div className="bg-[#f9f9f8] dark:bg-[#1d1d1b] border-t border-[#e5e5e5] dark:border-[#2d2d2d] p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-[14px] font-medium text-[#1a1a1a] dark:text-[#ececec]">{item.label}</p>
                      <p className="text-[11px] text-[#8e8e8e]">{item.w} x {item.h}px</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadPNG(svg, `knowhow-${item.id}.png`, item.w, item.h)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] text-[12px] font-medium hover:opacity-90 transition-opacity">
                        <Download size={12} /> PNG
                      </button>
                      <button onClick={() => downloadPNG(svg, `knowhow-${item.id}@2x.png`, item.w * 2, item.h * 2)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#2d2d2d] text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <Download size={12} /> PNG @2x
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Brand Colors */}
        <section>
          <h2 className="text-[28px] font-serif font-medium text-[#1a1a1a] dark:text-[#ececec] mb-2 text-center">{translate('brand_colors', 'Brand Colors')}</h2>
          <p className="text-[#8e8e8e] text-[14px] mb-8 text-center">{translate('brand_colors_desc', 'Official color palette')}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: translate('brand_primary', 'Primary'), hex: '#033C81', label: translate('brand_warm_terracotta', 'Warm Terracotta') },
              { name: translate('brand_text_dark', 'Text Dark'), hex: '#1a1a1a', label: translate('brand_near_black', 'Near Black') },
              { name: translate('brand_text_light', 'Text Light'), hex: '#ececec', label: translate('brand_off_white', 'Off White') },
              { name: translate('brand_accent', 'Accent'), hex: '#5c7cfa', label: translate('brand_blue', 'Blue') },
            ].map((color) => (
              <div key={color.hex} className="rounded-2xl border border-[#e5e5e5] dark:border-[#2d2d2d] overflow-hidden">
                <div className="h-20" style={{ backgroundColor: color.hex }} />
                <div className="p-3 bg-white dark:bg-[#1d1d1b]">
                  <p className="text-[13px] font-medium text-[#1a1a1a] dark:text-[#ececec]">{color.name}</p>
                  <p className="text-[11px] text-[#8e8e8e]">{color.hex} &middot; {color.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
