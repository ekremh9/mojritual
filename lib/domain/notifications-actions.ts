'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { markAllAsRead } from '@/lib/domain/notifications';

/**
 * Označava sva obavještenja prijavljenog korisnika pročitanim i revalidira
 * layout segmente koji renderuju badge broja nepročitanih (Header na shop
 * stranicama, PortalHeader/PortalNav u portalu brenda) — bez ovoga badge
 * ostaje "star" dok korisnik ručno ne osvježi stranicu (F5), jer Next.js
 * klijentski router cache i dalje služi staru RSC verziju layouta.
 *
 * Mora biti Server Action, ne obična funkcija pozvana direktno iz
 * Server Component page-a: `revalidatePath` baca grešku ako se pozove
 * tokom render-a rute ("used ... during render which is unsupported"),
 * dozvoljen je samo iz Server Action-a ili Route Handler-a. Zato se ovo
 * pokreće sa klijenta, na mount stranice obavještenja (vidi
 * `MarkNotificationsReadOnView`), ne direktno unutar page.tsx.
 *
 * `userId` dolazi isključivo iz sesije, nikad kao parametar — ista granica
 * kao u ostalim *-actions.ts fajlovima.
 *
 * Revalidira OBA layout segmenta (shop '/' i portal '/portal') bez obzira
 * odakle je pozvano — jeftino je (samo označava cache tag zastarjelim, ne
 * prisiljava ponovni render neposjećenih ruta) i izbjegava potrebu da akcija
 * zna u kojem je kontekstu pokrenuta.
 */
export async function markAllAsReadAction(): Promise<void> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return;
    }

    await markAllAsRead(session.user.id);

    revalidatePath('/', 'layout');
    revalidatePath('/portal', 'layout');
  } catch {
    console.error('markAllAsReadAction: označavanje obavještenja pročitanim nije uspjelo');
  }
}
