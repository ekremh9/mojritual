/**
 * Poslovna logika korpe — čista, bez React i bez baze.
 *
 * Korpa se uvijek lomi na grupe po brendu: svaki brend ima svoju cijenu
 * dostave i svoj prag besplatne dostave, pa korpa s tri brenda znači tri
 * isporuke i tri troška dostave (spec 12.1).
 *
 * Sve cijene su cijeli brojevi u fening.
 */
import { izracunajJedinicnuCijenu, type WholesalePrag } from '@/lib/domain/wholesale-tiers';

export const MAX_KOLICINA_PO_STAVCI = 99;
/**
 * Odobreni partneri naručuju veleprodajne količine — 99 bi ih tiho
 * ograničilo. Primjenjuje se SAMO kad se `jePartner=true` eksplicitno
 * proslijedi (nikad podrazumijevano — vidi `normalizujKolicinu`).
 */
export const MAX_KOLICINA_PARTNER = 10000;

/** Ono što se čuva na klijentu — nikad cijena, samo šta i koliko. */
export type KorpaStavka = {
  productId: string;
  kolicina: number;
};

export type KorpaBrend = {
  id: string;
  slug: string;
  naziv: string;
  /** Fening. Obavezno polje brenda; 0 znači besplatna dostava. */
  cijenaDostave: number;
  /** Fening, ili `null` kad brend nema besplatnu dostavu. */
  pragBesplatneDostave: number | null;
};

/** Podaci o proizvodu koji dolaze iz baze, ne od klijenta. */
export type KorpaProizvod = {
  id: string;
  slug: string;
  naziv: string;
  /** Fening. */
  cijena: number;
  /**
   * Veleprodajni pragovi za ovaj proizvod — `undefined` znači da pozivalac
   * NIJE odobren partner (vidi `getCartProductsData`: polje se namjerno
   * izostavlja za goste/kupce, ne šalje se prazan niz, da se veleprodajne
   * cijene ne otkrivaju kroz mrežni odgovor neovlaštenim korisnicima).
   * Prisustvo nepraznog niza je samo po sebi signal da `izracunajKorpu`
   * treba primijeniti popust — nema posebnog `jePartner` parametra.
   */
  pragovi?: WholesalePrag[];
  slika: { url: string; alt: string | null } | null;
  brend: KorpaBrend;
};

export type KorpaLinija = {
  proizvod: KorpaProizvod;
  kolicina: number;
  /** Fening — stvarna cijena po komadu za ovu stavku (uključuje veleprodajni popust kad je primjenjiv). Jednako `proizvod.cijena` kad popust nije primijenjen. */
  jedinicnaCijena: number;
  /** Fening. */
  medjuzbir: number;
};

export type KorpaGrupa = {
  brend: KorpaBrend;
  linije: KorpaLinija[];
  /** Fening, bez dostave. */
  medjuzbir: number;
  /** Fening — koliko se stvarno naplaćuje za ovu pošiljku. */
  dostava: number;
  besplatnaDostava: boolean;
  /** Fening do praga besplatne dostave, ili `null` kad prag ne postoji ili je dostignut. */
  doBesplatneDostave: number | null;
};

export type Korpa = {
  grupe: KorpaGrupa[];
  /** Fening, zbir svih proizvoda bez dostave. */
  medjuzbir: number;
  /** Fening, zbir dostava svih pošiljki. */
  dostavaUkupno: number;
  /** Fening. */
  ukupno: number;
  brojArtikala: number;
};

/**
 * `jePartner` bira gornju granicu — `false` (podrazumijevano) znači
 * MAX_KOLICINA_PO_STAVCI, čak i kad pozivalac ne prosljedi taj parametar
 * uopšte. Svako pozivno mjesto koje MOŽE utvrditi da je pozivalac odobreni
 * partner ga mora eksplicitno proslijediti — ništa se ne pretpostavlja.
 */
export function normalizujKolicinu(kolicina: number, jePartner = false): number {
  if (!Number.isFinite(kolicina)) {
    return 1;
  }

  const max = jePartner ? MAX_KOLICINA_PARTNER : MAX_KOLICINA_PO_STAVCI;
  return Math.min(Math.max(Math.floor(kolicina), 1), max);
}

/**
 * Dodaje proizvod u korpu ili uvećava postojeću količinu.
 * Vraća novu listu — ulazna se ne mijenja.
 */
export function dodajStavku(
  stavke: readonly KorpaStavka[],
  productId: string,
  kolicina = 1,
  jePartner = false,
): KorpaStavka[] {
  const dodatak = normalizujKolicinu(kolicina, jePartner);
  const postojeca = stavke.find((stavka) => stavka.productId === productId);

  if (!postojeca) {
    return [...stavke, { productId, kolicina: dodatak }];
  }

  return stavke.map((stavka) =>
    stavka.productId === productId
      ? { ...stavka, kolicina: normalizujKolicinu(stavka.kolicina + dodatak, jePartner) }
      : stavka,
  );
}

/** Postavlja tačnu količinu. Količina 0 ili manja uklanja stavku. */
export function postaviKolicinu(
  stavke: readonly KorpaStavka[],
  productId: string,
  kolicina: number,
  jePartner = false,
): KorpaStavka[] {
  if (!Number.isFinite(kolicina) || kolicina < 1) {
    return ukloniStavku(stavke, productId);
  }

  return stavke.map((stavka) =>
    stavka.productId === productId
      ? { ...stavka, kolicina: normalizujKolicinu(kolicina, jePartner) }
      : stavka,
  );
}

export function ukloniStavku(
  stavke: readonly KorpaStavka[],
  productId: string,
): KorpaStavka[] {
  return stavke.filter((stavka) => stavka.productId !== productId);
}

export function brojArtikala(stavke: readonly KorpaStavka[]): number {
  return stavke.reduce((zbir, stavka) => zbir + stavka.kolicina, 0);
}

/**
 * Čita stavke iz nepouzdanog izvora (localStorage, tijelo zahtjeva).
 * Sve što nije ispravno se tiho odbacuje — korpa nikad ne smije puknuti.
 *
 * Kad se poziva nad tijelom zahtjeva (npr. `createOrderAction`), `jePartner`
 * MORA doći iz `auth()` sesije na serveru — ovo je stvarna granica koja
 * odbacuje pokušaj gosta/kupca da naruči veleprodajnu količinu, klijentski
 * klemp je samo UX pogodnost.
 */
export function parsirajStavke(ulaz: unknown, jePartner = false): KorpaStavka[] {
  if (!Array.isArray(ulaz)) {
    return [];
  }

  const spojene = new Map<string, number>();

  for (const kandidat of ulaz) {
    if (typeof kandidat !== 'object' || kandidat === null) {
      continue;
    }

    const { productId, kolicina } = kandidat as { productId?: unknown; kolicina?: unknown };

    if (typeof productId !== 'string' || productId.length === 0) {
      continue;
    }

    if (typeof kolicina !== 'number') {
      continue;
    }

    const prethodna = spojene.get(productId) ?? 0;
    spojene.set(
      productId,
      normalizujKolicinu(prethodna + normalizujKolicinu(kolicina, jePartner), jePartner),
    );
  }

  return [...spojene].map(([productId, kolicina]) => ({ productId, kolicina }));
}

/**
 * Dostava za jednu pošiljku (jedan brend).
 *
 * Prag `null` znači da brend nema besplatnu dostavu. Cijena dostave 0 znači
 * da brend ne naplaćuje dostavu uopšte.
 */
export function izracunajDostavu(
  medjuzbir: number,
  brend: Pick<KorpaBrend, 'cijenaDostave' | 'pragBesplatneDostave'>,
): Pick<KorpaGrupa, 'dostava' | 'besplatnaDostava' | 'doBesplatneDostave'> {
  if (brend.cijenaDostave <= 0) {
    return { dostava: 0, besplatnaDostava: true, doBesplatneDostave: null };
  }

  const prag = brend.pragBesplatneDostave;

  if (prag === null) {
    return { dostava: brend.cijenaDostave, besplatnaDostava: false, doBesplatneDostave: null };
  }

  if (medjuzbir >= prag) {
    return { dostava: 0, besplatnaDostava: true, doBesplatneDostave: null };
  }

  return {
    dostava: brend.cijenaDostave,
    besplatnaDostava: false,
    doBesplatneDostave: prag - medjuzbir,
  };
}

/**
 * Spaja stavke s klijenta i proizvode iz baze u obračunatu korpu.
 *
 * Stavke čiji proizvod nije u `proizvodi` (obrisan, povučen, neodobren) se
 * preskaču — pozivalac ih prepoznaje po `Korpa.brojArtikala` ili preko
 * `nedostajuciIds`.
 *
 * `jePartner` ovdje utiče SAMO na gornju granicu količine (vidi
 * `normalizujKolicinu`) — bira se globalno za cijeli poziv, ne po
 * proizvodu, jer je to osobina KORISNIKA (odobren partner ili ne), ne
 * proizvoda. Server (`createOrderAction`) ovo MORA proslijediti iz
 * `auth()` sesije — ako se ne proslijedi, podrazumijeva se `false`
 * (MAX_KOLICINA_PO_STAVCI), nikad obrnuto, da propust ne otvori veći limit
 * nego što je namijenjeno.
 */
export function izracunajKorpu(
  stavke: readonly KorpaStavka[],
  proizvodi: readonly KorpaProizvod[],
  jePartner = false,
): Korpa {
  const poId = new Map(proizvodi.map((proizvod) => [proizvod.id, proizvod]));
  const grupePoBrendu = new Map<string, KorpaGrupa>();

  for (const stavka of stavke) {
    const proizvod = poId.get(stavka.productId);
    if (!proizvod) {
      continue;
    }

    const kolicina = normalizujKolicinu(stavka.kolicina, jePartner);
    // Prisustvo `pragovi` (nepraznog niza) je jedini signal za veleprodajni
    // popust — `getCartProductsData` ga postavlja SAMO za odobrene
    // partnere, pa ovdje nema potrebe za odvojenim `jePartner` parametrom
    // (i ne bi ni trebalo: ova funkcija je čista, bez pristupa sesiji).
    const jedinicnaCijena =
      proizvod.pragovi && proizvod.pragovi.length > 0
        ? izracunajJedinicnuCijenu(proizvod.cijena, kolicina, proizvod.pragovi)
        : proizvod.cijena;
    const linija: KorpaLinija = {
      proizvod,
      kolicina,
      jedinicnaCijena,
      medjuzbir: jedinicnaCijena * kolicina,
    };

    const postojeca = grupePoBrendu.get(proizvod.brend.id);

    if (postojeca) {
      postojeca.linije.push(linija);
      postojeca.medjuzbir += linija.medjuzbir;
    } else {
      grupePoBrendu.set(proizvod.brend.id, {
        brend: proizvod.brend,
        linije: [linija],
        medjuzbir: linija.medjuzbir,
        dostava: 0,
        besplatnaDostava: false,
        doBesplatneDostave: null,
      });
    }
  }

  const grupe = [...grupePoBrendu.values()]
    .map((grupa) => ({ ...grupa, ...izracunajDostavu(grupa.medjuzbir, grupa.brend) }))
    .sort((a, b) => a.brend.naziv.localeCompare(b.brend.naziv, 'bs'));

  const medjuzbir = grupe.reduce((zbir, grupa) => zbir + grupa.medjuzbir, 0);
  const dostavaUkupno = grupe.reduce((zbir, grupa) => zbir + grupa.dostava, 0);
  const ukupnoArtikala = grupe.reduce(
    (zbir, grupa) => zbir + grupa.linije.reduce((manji, linija) => manji + linija.kolicina, 0),
    0,
  );

  return {
    grupe,
    medjuzbir,
    dostavaUkupno,
    ukupno: medjuzbir + dostavaUkupno,
    brojArtikala: ukupnoArtikala,
  };
}

/** Id-evi stavki za koje nema proizvoda — klijent ih briše iz korpe. */
export function nedostajuciIds(
  stavke: readonly KorpaStavka[],
  proizvodi: readonly KorpaProizvod[],
): string[] {
  const poznati = new Set(proizvodi.map((proizvod) => proizvod.id));
  return stavke.filter((stavka) => !poznati.has(stavka.productId)).map((stavka) => stavka.productId);
}
