import { eq, like, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brandUsers, brands, users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/domain/auth';
import { generisiSlug } from '@/lib/domain/slug';

export type BrandRegistrationErrorCode = 'email_zauzet';

/** Domenska greška — poruku za korisnika bira pozivalac iz `/lib/i18n/bs.ts`. */
export class BrandRegistrationError extends Error {
  readonly code: BrandRegistrationErrorCode;

  constructor(code: BrandRegistrationErrorCode) {
    super(code);
    this.name = 'BrandRegistrationError';
    this.code = code;
  }
}

/** Dodaje broj kad se osnovni slug poklapa sa postojećim (`naziv`, `naziv-2`, ...). */
async function osiguraJedinstvenSlugBrenda(baza: string): Promise<string> {
  const postojeci = await db
    .select({ slug: brands.slug })
    .from(brands)
    .where(or(eq(brands.slug, baza), like(brands.slug, `${baza}-%`)));

  const zauzeti = new Set(postojeci.map((red) => red.slug));
  if (!zauzeti.has(baza)) {
    return baza;
  }

  let broj = 2;
  while (zauzeti.has(`${baza}-${broj}`)) {
    broj += 1;
  }
  return `${baza}-${broj}`;
}

/**
 * Self-service registracija brenda: kreira korisnika (role `brand`) i sam
 * brend u statusu `na_cekanju` (spec 10.1, 10.4) — javno vidljiv tek nakon
 * odobrenja admina. Vlasnik dobija pristup portalu odmah, prije odobrenja.
 */
export async function registerBrandOwner(input: {
  ime: string;
  email: string;
  password: string;
  brandNaziv: string;
}): Promise<{ userId: string; brandId: string }> {
  const { ime, email, password, brandNaziv } = input;

  const [postojeciKorisnik] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (postojeciKorisnik) {
    throw new BrandRegistrationError('email_zauzet');
  }

  const passwordHash = await hashPassword(password);
  const slug = await osiguraJedinstvenSlugBrenda(generisiSlug(brandNaziv));

  return db.transaction(async (tx) => {
    const [noviKorisnik] = await tx
      .insert(users)
      .values({ email, passwordHash, ime, role: 'brand' })
      .returning({ id: users.id });

    const userId = noviKorisnik!.id;

    const [noviBrend] = await tx
      .insert(brands)
      .values({ naziv: brandNaziv, slug })
      .returning({ id: brands.id });

    const brandId = noviBrend!.id;

    await tx.insert(brandUsers).values({ userId, brandId, uloga: 'vlasnik' });

    return { userId, brandId };
  });
}
