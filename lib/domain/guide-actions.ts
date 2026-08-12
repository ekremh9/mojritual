'use server';

/**
 * Server action koji izračunava rezultat Ritual Vodiča — statični pristup,
 * bez AI poziva. Rangiranje unutar svake grupe dolazi isključivo iz
 * `product_goals.relevantnost`/`.oznaka` (CLAUDE.md pravilo 2).
 *
 * Odgovori korisnika (uključujući koraka 3, koji trenutno ne filtriraju
 * rezultat) se snimaju u `guide_sessions` radi buduće statistike i faze
 * gdje će ti odgovori uticati na preporuku.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  goals,
  guideExplanationTemplates,
  guideSessions,
  productGoals,
  productImages,
  products,
} from '@/lib/db/schema';
import {
  poredakOznakaIRelevantnosti,
  validanBrojCiljeva,
  type GuideOdgovori,
  type GuideProizvod,
  type GuideRezultat,
  type GuideRezultatGrupa,
} from '@/lib/domain/guide';
import { bs } from '@/lib/i18n/bs';

export type ComputeGuideResultRezultat =
  | { ok: true; rezultat: GuideRezultat; sessionId: string }
  | { ok: false; error: string };

export type SaveGuideResultRezultat = { ok: true } | { ok: false; error: string };

export async function computeGuideResultAction(
  odgovori: GuideOdgovori,
): Promise<ComputeGuideResultRezultat> {
  try {
    const poruke = bs.vodic;
    const ciljeviId = [...new Set(odgovori.ciljevi)];

    if (!validanBrojCiljeva(ciljeviId)) {
      return { ok: false, error: poruke.greskaBrojCiljeva };
    }

    const odabraniCiljevi = await db
      .select({ id: goals.id, slug: goals.slug, naziv: goals.naziv })
      .from(goals)
      .where(inArray(goals.id, ciljeviId));

    if (odabraniCiljevi.length === 0) {
      return { ok: false, error: poruke.greskaOpsta };
    }

    // Zadržava redoslijed kojim je korisnik birao ciljeve u koraku 2 —
    // nepoznati/nevažeći id-evi se tiho odbacuju.
    const ciljPoId = new Map(odabraniCiljevi.map((cilj) => [cilj.id, cilj]));
    const ciljeviURedoslijedu = ciljeviId
      .map((id) => ciljPoId.get(id))
      .filter((cilj): cilj is (typeof odabraniCiljevi)[number] => cilj !== undefined);

    const idsZaUpit = ciljeviURedoslijedu.map((cilj) => cilj.id);

    const aktivniTekstovi = await db
      .select({ goalId: guideExplanationTemplates.goalId, tekst: guideExplanationTemplates.tekst })
      .from(guideExplanationTemplates)
      .where(
        and(
          inArray(guideExplanationTemplates.goalId, idsZaUpit),
          eq(guideExplanationTemplates.aktivan, true),
        ),
      );
    const tekstPoGoalId = new Map(aktivniTekstovi.map((red) => [red.goalId, red.tekst]));

    const veze = await db
      .select({
        goalId: productGoals.goalId,
        productId: productGoals.productId,
        relevantnost: productGoals.relevantnost,
        oznaka: productGoals.oznaka,
      })
      .from(productGoals)
      .innerJoin(products, eq(productGoals.productId, products.id))
      .where(and(inArray(productGoals.goalId, idsZaUpit), eq(products.status, 'odobren')));

    const productIds = [...new Set(veze.map((veza) => veza.productId))];

    const proizvodiRedovi = productIds.length
      ? await db
          .select({
            id: products.id,
            slug: products.slug,
            naziv: products.naziv,
            kratkiOpis: products.kratkiOpis,
            cijena: products.cijena,
          })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];

    const slike = productIds.length
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            alt: productImages.alt,
            redoslijed: productImages.redoslijed,
          })
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(asc(productImages.redoslijed))
      : [];

    const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
    for (const slika of slike) {
      if (!prvaSlikaPoProizvodu.has(slika.productId)) {
        prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
      }
    }

    const proizvodPoId = new Map(proizvodiRedovi.map((proizvod) => [proizvod.id, proizvod]));

    const grupe: GuideRezultatGrupa[] = ciljeviURedoslijedu.map((cilj) => {
      const vezeZaCilj = veze
        .filter((veza) => veza.goalId === cilj.id)
        .slice()
        .sort(poredakOznakaIRelevantnosti);

      const proizvodi: GuideProizvod[] = vezeZaCilj
        .map((veza) => proizvodPoId.get(veza.productId))
        .filter((proizvod): proizvod is (typeof proizvodiRedovi)[number] => proizvod !== undefined)
        .map((proizvod) => ({
          id: proizvod.id,
          slug: proizvod.slug,
          naziv: proizvod.naziv,
          kratkiOpis: proizvod.kratkiOpis,
          cijena: proizvod.cijena,
          slika: prvaSlikaPoProizvodu.get(proizvod.id) ?? null,
        }));

      return {
        goalId: cilj.id,
        goalSlug: cilj.slug,
        naziv: cilj.naziv,
        tekstObjasnjenja: tekstPoGoalId.get(cilj.id) ?? null,
        proizvodi,
      };
    });

    const rezultat: GuideRezultat = { grupe };

    const session = await auth();
    const [noviRed] = await db
      .insert(guideSessions)
      .values({
        userId: session?.user?.id ?? null,
        odgovori,
        rezultat,
        sacuvano: false,
      })
      .returning({ id: guideSessions.id });

    return { ok: true, rezultat, sessionId: noviRed.id };
  } catch {
    console.error('computeGuideResultAction: izračun rezultata Ritual Vodiča nije uspio');
    return { ok: false, error: bs.vodic.greskaOpsta };
  }
}

/**
 * Trajno snima rezultat Vodiča na nalog prijavljenog korisnika. Ovo je i
 * trenutak kad se anonimna sesija (kreirana u computeGuideResultAction) veže
 * za nalog — korisnik je u međuvremenu mogao ostati gost pa se naknadno
 * prijaviti.
 */
export async function saveGuideResultAction(sessionId: string): Promise<SaveGuideResultRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: bs.vodic.rezultat.greskaNijeUlogovan };
    }

    await db
      .update(guideSessions)
      .set({ sacuvano: true, userId: session.user.id })
      .where(eq(guideSessions.id, sessionId));

    return { ok: true };
  } catch {
    console.error('saveGuideResultAction: snimanje rezultata Ritual Vodiča nije uspjelo');
    return { ok: false, error: bs.vodic.greskaOpsta };
  }
}
