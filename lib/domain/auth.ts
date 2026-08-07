import { hash as bcryptHash, compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, type NewUser, type User } from '@/lib/db/schema';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcryptHash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export type PublicUser = Omit<User, 'passwordHash'>;

export async function registerUser(input: {
  email: string;
  password: string;
  ime: string;
  role: NewUser['role'];
}): Promise<PublicUser> {
  const { email, password, ime, role } = input;

  const [postojeci] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (postojeci) {
    throw new Error('Korisnik sa ovom email adresom već postoji.');
  }

  const passwordHash = await hashPassword(password);

  const [noviKorisnik] = await db
    .insert(users)
    .values({ email, passwordHash, ime, role })
    .returning();

  const { passwordHash: _passwordHash, ...publicUser } = noviKorisnik;
  return publicUser;
}
