import sharp from 'sharp';
import { mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ラーメン丼をモチーフにしたSVGアイコン
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="512" height="512" fill="#1a0f0a"/>

  <!-- 丼本体（楕円形） -->
  <ellipse cx="256" cy="320" rx="180" ry="80" fill="#2d1f15"/>
  <ellipse cx="256" cy="280" rx="160" ry="70" fill="#3d2f25"/>
  <ellipse cx="256" cy="260" rx="150" ry="60" fill="#c94a4a"/>

  <!-- 丼の縁（金色） -->
  <ellipse cx="256" cy="260" rx="150" ry="60" fill="none" stroke="#d4af37" stroke-width="6"/>

  <!-- 麺（クリーム色の波線） -->
  <path d="M140 250 Q180 230, 220 250 Q260 270, 300 250 Q340 230, 370 250"
        fill="none" stroke="#ffecd2" stroke-width="12" stroke-linecap="round"/>
  <path d="M160 270 Q200 250, 240 270 Q280 290, 320 270 Q360 250, 380 270"
        fill="none" stroke="#ffecd2" stroke-width="10" stroke-linecap="round"/>

  <!-- 湯気 -->
  <path d="M180 180 Q170 150, 190 120" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
  <path d="M256 160 Q246 130, 266 100" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <path d="M332 180 Q342 150, 322 120" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.5"/>

  <!-- 箸（斜め） -->
  <rect x="340" y="140" width="12" height="160" rx="6" fill="#8b4513" transform="rotate(25 346 220)"/>
  <rect x="360" y="150" width="12" height="160" rx="6" fill="#8b4513" transform="rotate(25 366 230)"/>

  <!-- 箸の金装飾 -->
  <rect x="340" y="140" width="12" height="20" rx="3" fill="#d4af37" transform="rotate(25 346 150)"/>
  <rect x="360" y="150" width="12" height="20" rx="3" fill="#d4af37" transform="rotate(25 366 160)"/>
</svg>
`;

async function generateIcons() {
  console.log('PWAアイコンを生成中...');

  // SVGからPNGを生成
  const svgBuffer = Buffer.from(svgIcon);

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));
  console.log('✓ pwa-512x512.png');

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));
  console.log('✓ pwa-192x192.png');

  // favicon (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('✓ favicon.ico');

  // Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  console.log('\nPWAアイコンの生成が完了しました！');
}

generateIcons().catch(console.error);
