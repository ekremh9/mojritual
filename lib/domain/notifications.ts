import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications, type Notification } from '@/lib/db/schema';

export type NotificationTip = Notification['tip'];

const DEFAULT_LIMIT = 20;

/**
 * Kreira obavještenje. Nikad ne baca grešku pozivaocu — isti pattern kao
 * slanje emaila (lib/email/send.ts): obavještenje koje ne uspije da se
 * kreira ne smije oboriti glavnu radnju (npr. odobrenje proizvoda).
 */
export async function createNotification(
  userId: string,
  tip: NotificationTip,
  naslov: string,
  sadrzaj: string,
  link?: string,
): Promise<void> {
  try {
    await db.insert(notifications).values({ userId, tip, naslov, sadrzaj, link: link ?? null });
  } catch {
    console.error('createNotification: kreiranje obavještenja nije uspjelo');
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [red] = await db
    .select({ ukupno: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.procitano, false)));

  return red?.ukupno ?? 0;
}

export async function getNotifications(
  userId: string,
  limit: number = DEFAULT_LIMIT,
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Označava JEDNO obavještenje pročitanim. `userId` je DIO WHERE klauzule,
 * ne naknadna provjera nakon SELECT-a — korisnik ne može označiti tuđe
 * obavještenje pročitanim slanjem tuđeg `notificationId`-a.
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ procitano: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db.update(notifications).set({ procitano: true }).where(eq(notifications.userId, userId));
}
