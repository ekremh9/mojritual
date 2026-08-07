import { config } from 'dotenv';

config({ path: '.env.local' });

import { eq, inArray } from 'drizzle-orm';
import {
  brands,
  categories,
  goals,
  productCategories,
  productGoals,
  productImages,
  products,
} from './schema';

type Database = typeof import('./index').db;

async function seedCategories(db: Database) {
  const data = [
    { slug: 'imunitet-i-energija', naziv: 'Imunitet i Energija' },
    { slug: 'kosa-koza-i-nokti', naziv: 'Kosa, Koža i Nokti' },
    { slug: 'kosti-zglobovi-misici', naziv: 'Kosti, Zglobovi, Mišići' },
    { slug: 'probava-i-metabolizam', naziv: 'Probava i Metabolizam' },
    { slug: 'san-i-opustanje', naziv: 'San i Opuštanje' },
  ];

  await db.insert(categories).values(data).onConflictDoNothing({ target: categories.slug });

  const rows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(
      inArray(
        categories.slug,
        data.map((d) => d.slug),
      ),
    );

  console.log(`Kreirano ${data.length} kategorija`);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function seedGoals(db: Database) {
  const data = [
    { slug: 'vise-energije', naziv: 'Više energije' },
    { slug: 'bolji-san', naziv: 'Bolji san' },
    { slug: 'jaci-imunitet', naziv: 'Jači imunitet' },
    { slug: 'zdrava-kosa-koza-nokti', naziv: 'Zdrava kosa, koža i nokti' },
    { slug: 'zglobovi-i-pokretljivost', naziv: 'Zglobovi i pokretljivost' },
    { slug: 'probava-i-metabolizam', naziv: 'Probava i metabolizam' },
    { slug: 'podrska-kod-treninga', naziv: 'Podrška kod treninga' },
  ];

  await db.insert(goals).values(data).onConflictDoNothing({ target: goals.slug });

  const rows = await db
    .select({ id: goals.id, slug: goals.slug })
    .from(goals)
    .where(
      inArray(
        goals.slug,
        data.map((d) => d.slug),
      ),
    );

  console.log(`Kreirano ${data.length} ciljeva`);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function seedBrand(db: Database) {
  const slug = 'nordic-labs';

  await db
    .insert(brands)
    .values({
      slug,
      naziv: 'Nordic Labs',
      kratkiOpis: 'Skandinavski standard kvalitete u dodacima prehrani.',
      status: 'odobren',
      verifikovan: true,
      cijenaDostave: 500,
      pragBesplatneDostave: 8000,
    })
    .onConflictDoNothing({ target: brands.slug });

  const [row] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, slug));

  console.log('Kreiran 1 brend (Nordic Labs)');
  return row.id;
}

async function seedProducts(
  db: Database,
  brandId: string,
  categoryIdBySlug: Map<string, string>,
  goalIdBySlug: Map<string, string>,
) {
  const data = [
    {
      slug: 'magnezij-bisglicinat-400mg',
      naziv: 'Magnezij Bisglicinat 400mg',
      kratkiOpis: 'Visoko bioraspoloživ oblik magnezija za nervni sistem i mišiće.',
      opis:
        'Magnezij bisglicinat je helatni oblik magnezija koji tijelo lakše apsorbuje od uobičajenih soli poput magnezijum oksida, uz manju šansu za nadražaj probavnog sistema. Doprinosi normalnoj funkciji mišića i nervnog sistema, te smanjenju umora i iscrpljenosti.\n\nPogodan je za svakodnevnu upotrebu, a posebno ga biraju osobe izložene stresu, sportisti i osobe sa poremećajima sna. Kapsule su bez vještačkih boja i konzervansa.',
      forma: 'kapsula' as const,
      doziranje: '1 kapsula dnevno uz obrok, sa dovoljno vode.',
      cijena: 3490,
      categorySlug: 'probava-i-metabolizam',
      goalSlug: 'probava-i-metabolizam',
    },
    {
      slug: 'vitamin-d3-2000-iu',
      naziv: 'Vitamin D3 2000 IU',
      kratkiOpis: 'Kapi vitamina D3 za jačanje imuniteta i zdravlje kostiju.',
      opis:
        'Vitamin D3 (holekalciferol) je ključan za normalnu funkciju imunološkog sistema, apsorpciju kalcija i održavanje zdravih kostiju i zuba. U našim geografskim širinama, posebno tokom jesensko-zimskih mjeseci, unos putem hrane i sunca često nije dovoljan.\n\nTečna formula omogućava preciznu i jednostavnu dozu, a neutralnog je ukusa pa je pogodna za cijelu porodicu. Baza je organsko kokosovo ulje radi bolje apsorpcije.',
      forma: 'tecnost' as const,
      doziranje: '2 kapi dnevno, direktno u usta ili uz obrok.',
      cijena: 2150,
      categorySlug: 'imunitet-i-energija',
      goalSlug: 'jaci-imunitet',
    },
    {
      slug: 'kolagen-peptidi-forte',
      naziv: 'Kolagen Peptidi Forte',
      kratkiOpis: 'Hidrolizirani kolagen u prahu za elastičnost kože i jače nokte.',
      opis:
        'Kolagen peptidi su hidrolizirani, niske molekularne težine, što omogućava brzu apsorpciju u organizmu. Redovna upotreba doprinosi elastičnosti i hidraciji kože, te jačanju kose i noktiju.\n\nPrah je bez ukusa i mirisa te se lako rastvara u vodi, kafi, čaju ili smoothieju. Jedna porcija sadrži dodatak vitamina C koji doprinosi normalnoj sintezi kolagena.',
      forma: 'prah' as const,
      doziranje: 'Jedna kašika (10g) dnevno rastvorena u tečnosti po izboru.',
      cijena: 4290,
      categorySlug: 'kosa-koza-i-nokti',
      goalSlug: 'zdrava-kosa-koza-nokti',
    },
    {
      slug: 'melatonin-3mg',
      naziv: 'Melatonin 3mg',
      kratkiOpis: 'Pomaže da brže zaspite i skratite vrijeme potrebno za uspavljivanje.',
      opis:
        'Melatonin je hormon koji prirodno reguliše ciklus spavanja i budnosti. Dodatak melatonina doprinosi skraćivanju vremena potrebnog da se zaspi, posebno kod osoba sa poremećenim ritmom spavanja usljed smjenskog rada ili putovanja kroz vremenske zone.\n\nTablete se uzimaju kratko prije spavanja i ne stvaraju naviku pri preporučenom doziranju. Ne sadrže šećer.',
      forma: 'tableta' as const,
      doziranje: '1 tableta dnevno, 30 minuta prije spavanja.',
      cijena: 1890,
      categorySlug: 'san-i-opustanje',
      goalSlug: 'bolji-san',
    },
    {
      slug: 'glukozamin-hondroitin',
      naziv: 'Glukozamin Hondroitin',
      kratkiOpis: 'Podrška zglobovima i hrskavici u obliku ukusnih žvakaćih tableta.',
      opis:
        'Kombinacija glukozamina i hondroitina spada u najistraženije formule za podršku zdravlju zglobova. Doprinosi normalnoj funkciji hrskavice, posebno kod osoba izloženih pojačanom fizičkom naporu ili kod prirodnog opterećenja zglobova s godinama.\n\nŽvakaći oblik pogodan je za osobe koje teže gutaju kapsule, prijatnog je voćnog ukusa i ne zahtijeva uzimanje vode.',
      forma: 'zvakaca' as const,
      doziranje: '2 žvakaće tablete dnevno uz obrok.',
      cijena: 3990,
      categorySlug: 'kosti-zglobovi-misici',
      goalSlug: 'zglobovi-i-pokretljivost',
    },
  ];

  await db.insert(products).values(
    data.map((p) => ({
      brandId,
      slug: p.slug,
      naziv: p.naziv,
      kratkiOpis: p.kratkiOpis,
      opis: p.opis,
      forma: p.forma,
      doziranje: p.doziranje,
      cijena: p.cijena,
      status: 'odobren' as const,
    })),
  ).onConflictDoNothing({ target: products.slug });

  const productRows = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(
      inArray(
        products.slug,
        data.map((d) => d.slug),
      ),
    );
  const productIdBySlug = new Map(productRows.map((r) => [r.slug, r.id]));

  for (const p of data) {
    const productId = productIdBySlug.get(p.slug);
    if (!productId) continue;

    const [existingImage] = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    if (!existingImage) {
      await db.insert(productImages).values({
        productId,
        url: `https://placehold.co/600x600?text=${encodeURIComponent(p.naziv)}`,
        alt: p.naziv,
        redoslijed: 0,
      });
    }

    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (categoryId) {
      await db
        .insert(productCategories)
        .values({ productId, categoryId })
        .onConflictDoNothing();
    }

    const goalId = goalIdBySlug.get(p.goalSlug);
    if (goalId) {
      await db
        .insert(productGoals)
        .values({ productId, goalId, relevantnost: 90 })
        .onConflictDoNothing();
    }
  }

  console.log(`Kreirano ${data.length} proizvoda`);
}

async function main() {
  const { db } = await import('./index');

  const categoryIdBySlug = await seedCategories(db);
  const goalIdBySlug = await seedGoals(db);
  const brandId = await seedBrand(db);
  await seedProducts(db, brandId, categoryIdBySlug, goalIdBySlug);

  console.log('Seed završen.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Greška prilikom seed-ovanja baze:', error);
  process.exit(1);
});
