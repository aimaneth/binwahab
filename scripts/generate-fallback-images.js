const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const fallbackImages = {
  'fallback-banner.jpg': { width: 1920, height: 1080, color: '#f3f4f6' },
  'fallback-collection.jpg': { width: 400, height: 300, color: '#e5e7eb' },
  'fallback-product.jpg': { width: 300, height: 300, color: '#d1d5db' }
};

async function generateFallbackImages() {
  const publicDir = path.join(process.cwd(), 'public', 'images');
  
  // Ensure the images directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const [filename, config] of Object.entries(fallbackImages)) {
    const filepath = path.join(publicDir, filename);
    
    // Create a colored rectangle with text
    await sharp({
      create: {
        width: config.width,
        height: config.height,
        channels: 4,
        background: config.color
      }
    })
    .composite([{
      input: {
        text: {
          text: 'Image not available',
          font: 'sans-serif',
          fontSize: 24,
          rgba: true
        }
      },
      gravity: 'center'
    }])
    .jpeg()
    .toFile(filepath);

    console.log(`Generated ${filename}`);
  }
}

generateFallbackImages().catch(console.error); 