const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const svgCode = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <path fill="#00d26a" d="M512 85.333l76.8 192 187.733-51.2-59.733 170.667 221.867 42.667-153.6 149.333 34.133 192-204.8-85.333-85.333 128V938.667h-34.134v-110.934L409.6 699.733l-204.8 85.334 34.133-192L85.333 443.733l221.867-42.666-59.733-170.667 187.733 51.2L512 85.333z"/>
</svg>`;

async function generateIcons() {
  const assetsDir = path.join(__dirname, '../public/assets/icons');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'favicon.ico', size: 64 }, // fallback ico using 64px png
  ];

  const svgBuffer = Buffer.from(svgCode);

  for (const { name, size } of sizes) {
    const outPath = path.join(assetsDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${name} (${size}x${size})`);
    
    // For favicon.ico, we'll also copy the 32x32 version to the root public folder
    if (name === 'favicon-32x32.png') {
        const rootIcoPath = path.join(__dirname, '../public/favicon.ico');
        fs.copyFileSync(outPath, rootIcoPath);
    }
  }
}

generateIcons().catch(console.error);
