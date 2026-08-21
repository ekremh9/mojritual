import sharp from 'sharp';

export async function processProductImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'cover', position: 'center' })
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
    .resize({ width: 400, height: 400, fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer();
}

export async function processBlogCover(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1600, height: 900, fit: 'cover', position: 'center' })
    .webp({ quality: 80 })
    .toBuffer();
}

/** Homepage hero slika — nije kvadratna kao proizvod, `fit: 'inside'` čuva originalne proporcije umjesto da siječe. */
export async function processHeroImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
