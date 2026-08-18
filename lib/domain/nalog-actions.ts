'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export type NalogRezultat = { ok: true } | { ok: false; error: string };

const MAX_DUZINA_IMENA = 100;

/**
 * Mijenja ime prijavljenog korisnika.
 *
 * `userId` se NIKAD ne prima kao parametar funkcije — uvijek dolazi
 * isključivo iz `auth()` sesije. Kad bi ga pozivalac mogao proslijediti,
 * bilo bi moguće izmijeniti tuđi nalog slanjem tuđeg id-a (ista klasa
 * greške kao curenje tuđih podataka).
 */
export async function updateImeAction(novoIme: string): Promise<NalogRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: bs.nalog.forma.greskaPristup };
    }

    const ocisceno = typeof novoIme === 'string' ? novoIme.trim() : '';

    if (ocisceno === '') {
      return { ok: false, error: bs.nalog.forma.validacija.imeObavezno };
    }

    if (ocisceno.length > MAX_DUZINA_IMENA) {
      return { ok: false, error: bs.nalog.forma.validacija.imePredugacko };
    }

    await db.update(users).set({ ime: ocisceno }).where(eq(users.id, session.user.id));

    revalidatePath('/nalog');

    return { ok: true };
  } catch {
    console.error('updateImeAction: izmjena imena nije uspjela');
    return { ok: false, error: bs.nalog.forma.greskaOpsta };
  }
}
