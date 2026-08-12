import sharp from 'sharp';

export async function processProductImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function processBrandCover(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1600, height: 600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function processBrandLogo(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
