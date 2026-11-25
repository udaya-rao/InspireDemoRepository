import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SRC = 'public/inspire-magnetics-logo-1.png';
const OUT = 'public/icons';
const BG = { r: 255, g: 255, b: 255, alpha: 1 }; // matches your splash background

mkdirSync(OUT, { recursive: true });

// ratio = how much of the square the logo's width takes up
async function make(size, ratio, file) {
  const logoWidth = Math.round(size * ratio);
  const logo = await sharp(SRC)
    .resize({ width: logoWidth, fit: 'inside' })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(file);

  console.log('wrote', file);
}

await make(192, 0.86, `${OUT}/icon-192.png`);
await make(512, 0.86, `${OUT}/icon-512.png`);
await make(512, 0.62, `${OUT}/maskable-512.png`);   // safe zone: Android crops to a circle
await make(180, 0.86, 'public/apple-touch-icon.png');