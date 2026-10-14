import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Crisp High-Tech Radar & Candlestick Stock SVG Icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="bullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="108" fill="url(#bgGrad)"/>
  <rect x="8" y="8" width="496" height="496" rx="100" fill="none" stroke="#6366f1" stroke-width="6" stroke-opacity="0.3"/>

  <!-- Radar Concentric Rings -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="6,6"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-opacity="0.3"/>
  <circle cx="256" cy="256" r="90" fill="none" stroke="#6366f1" stroke-width="2" stroke-opacity="0.4"/>
  <circle cx="256" cy="256" r="40" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.6"/>

  <!-- Crosshairs -->
  <line x1="66" y1="256" x2="446" y2="256" stroke="#475569" stroke-width="2" stroke-opacity="0.5"/>
  <line x1="256" y1="66" x2="256" y2="446" stroke="#475569" stroke-width="2" stroke-opacity="0.5"/>

  <!-- Candlesticks -->
  <line x1="150" y1="280" x2="150" y2="380" stroke="#10b981" stroke-width="4"/>
  <rect x="138" y="300" width="24" height="60" rx="4" fill="#10b981"/>

  <line x1="210" y1="220" x2="210" y2="340" stroke="#ef4444" stroke-width="4"/>
  <rect x="198" y="240" width="24" height="70" rx="4" fill="url(#bullGrad)"/>

  <line x1="270" y1="210" x2="270" y2="310" stroke="#f59e0b" stroke-width="4"/>
  <rect x="258" y="230" width="24" height="40" rx="4" fill="#f59e0b"/>

  <line x1="330" y1="120" x2="330" y2="260" stroke="#ef4444" stroke-width="5"/>
  <rect x="318" y="140" width="24" height="90" rx="4" fill="url(#bullGrad)"/>

  <path d="M 120 360 Q 230 310, 390 140" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/>
  <circle cx="390" cy="140" r="12" fill="#ef4444"/>
  <circle cx="390" cy="140" r="22" fill="#ef4444" fill-opacity="0.3"/>
  
  <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="4">台股雷達 PRO</text>
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#090d16"/>
  <g transform="translate(51, 51) scale(0.8)">
    ${svgIcon.replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf8');

  const svgBuffer = Buffer.from(svgIcon);
  const maskableBuffer = Buffer.from(maskableSvg);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Successfully generated PWA icon assets in public/');
}

run().catch(console.error);
