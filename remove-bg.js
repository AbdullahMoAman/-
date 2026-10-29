/**
 * Remove White Background from Logo
 * Using Sharp (Node.js)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function removeBackground() {
  const inputPath = path.join(__dirname, 'images', 'logo.jpg');
  const outputPath = path.join(__dirname, 'images', 'logo-transparent.png');

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // 1. Get raw image pixels
  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 2. Find bounding box of content (anything darker than near-white)
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let idx = (y * width + x) * channels;
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];
      // threshold: darker than 238 in any channel
      if (r < 238 || g < 238 || b < 238) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Add padding around content
  const pad = 16;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

  // 3. Extract cropped region
  const cropped = await sharp(inputPath)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .toBuffer();

  // 4. Create RGBA buffer with smooth anti-aliased transparency
  const { data: cData, info: cInfo } = await sharp(cropped)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outBuffer = Buffer.alloc(cInfo.width * cInfo.height * 4);

  for (let i = 0; i < cInfo.width * cInfo.height; i++) {
    let srcIdx = i * cInfo.channels;
    let dstIdx = i * 4;

    let r = cData[srcIdx];
    let g = cData[srcIdx + 1];
    let b = cData[srcIdx + 2];
    let gray = (r + g + b) / 3;

    // Smooth transparency:
    // gray >= 242 -> transparent (alpha = 0)
    // gray <= 45  -> opaque (alpha = 255)
    // intermediate -> smooth linear transition
    let alpha = 0;
    if (gray <= 45) {
      alpha = 255;
    } else if (gray < 242) {
      alpha = Math.round(255 * (1 - (gray - 45) / (242 - 45)));
    } else {
      alpha = 0;
    }

    outBuffer[dstIdx] = 0;
    outBuffer[dstIdx + 1] = 0;
    outBuffer[dstIdx + 2] = 0;
    outBuffer[dstIdx + 3] = alpha;
  }

  // 5. Save transparent PNG
  await sharp(outBuffer, {
    raw: {
      width: cInfo.width,
      height: cInfo.height,
      channels: 4
    }
  })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Successfully generated transparent logo: ${outputPath} (${cInfo.width}x${cInfo.height})`);
}

removeBackground().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});

