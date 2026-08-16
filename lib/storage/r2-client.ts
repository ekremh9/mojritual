import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID!;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/** Izvlači R2 key iz javnog URL-a koji je vratio `uploadNaR2`. */
export function kljucIzUrl(url: string): string | null {
  const prefiks = `${R2_PUBLIC_URL}/`;
  return url.startsWith(prefiks) ? url.slice(prefiks.length) : null;
}

/**
 * Briše fajl sa R2 na osnovu njegovog javnog URL-a. Zajednička logika za
 * svako mjesto koje briše sliku proizvoda ili brenda — da nijedno ne
 * ostavi orphan fajl na R2 kad obriše samo bazni red.
 */
export async function obrisiSaR2(url: string): Promise<void> {
  const kljuc = kljucIzUrl(url);
  if (!kljuc) {
    return;
  }
  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: kljuc }));
}
