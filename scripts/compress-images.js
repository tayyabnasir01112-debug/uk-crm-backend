import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const imagesDir = join(__dirname, '../attached_assets/generated_images');

async function compressImage(inputPath, outputPath) {
  try {
    const stats = await stat(inputPath);
    const originalSize = stats.size;
    
    console.log(`\n📸 Compressing: ${inputPath.split('/').pop()}`);
    console.log(`   Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Compress PNG with optimized settings for web
    // Use quality 80-85 for good balance, and optimize for web
    await sharp(inputPath)
      .resize(1920, null, { // Resize to max 1920px width for web
        withoutEnlargement: true,
        fit: 'inside',
      })
      .png({
        quality: 80,
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true, // Use palette mode for better compression
      })
      .toFile(outputPath);
    
    const newStats = await stat(outputPath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`   ✅ Compressed: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   💾 Saved: ${savings}%`);
    
    return { originalSize, newSize, savings };
  } catch (error) {
    console.error(`   ❌ Error compressing ${inputPath}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting image compression...\n');
    
    const files = await readdir(imagesDir);
    const pngFiles = files.filter(f => f.endsWith('.png'));
    
    if (pngFiles.length === 0) {
      console.log('❌ No PNG files found!');
      return;
    }
    
    console.log(`Found ${pngFiles.length} PNG files to compress\n`);
    
    let totalOriginal = 0;
    let totalCompressed = 0;
    
    // Create backup directory
    const backupDir = join(imagesDir, 'backup');
    await import('fs').then(fs => {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
    });
    
    for (const file of pngFiles) {
      const inputPath = join(imagesDir, file);
      const backupPath = join(backupDir, file);
      const tempPath = join(imagesDir, file.replace('.png', '.compressed.png'));
      
      // Backup original
      await import('fs/promises').then(fs => fs.copyFile(inputPath, backupPath));
      
      // Compress to temp file
      const result = await compressImage(inputPath, tempPath);
      totalOriginal += result.originalSize;
      totalCompressed += result.newSize;
      
      // Replace original with compressed
      await import('fs/promises').then(fs => {
        fs.rename(tempPath, inputPath);
      });
    }
    
    const totalSavings = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Compression Complete!');
    console.log(`   Total original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total compressed: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   💾 Total savings: ${totalSavings}%`);
    console.log(`\n📦 Backups saved to: ${backupDir}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

