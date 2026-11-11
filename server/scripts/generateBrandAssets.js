// Regenerates the static brand assets in client/public from the SVG favicon and
// an existing hero photo. Run once (or whenever the brand colours change):
//   node scripts/generateBrandAssets.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, '..', '..', 'client', 'public');

const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0f6b4f" />
  <text x="32" y="43" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" text-anchor="middle" fill="#f4efe6">RE</text>
</svg>`;

async function main() {
  const svg = Buffer.from(faviconSvg);

  // A 32x32 PNG wrapped in an ICO container. Modern browsers accept PNG data
  // inside an .ico file; this keeps the icon crisp without a legacy BMP encoder.
  const png = await sharp(svg).resize(32, 32).png().toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12); // offset: header + one directory entry
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), Buffer.concat([header, entry, png]));

  // Social preview card (1200x630) cropped from the hero image.
  const hero = path.join(publicDir, 'img', 'listings', 'hero-home.jpg');
  if (fs.existsSync(hero)) {
    await sharp(hero)
      .resize(1200, 630, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(publicDir, 'img', 'og-cover.jpg'));
  }

  console.log('Brand assets written to', publicDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
