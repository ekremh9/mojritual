import { describe, expect, it } from 'vitest';
import {
  MAX_KOLICINA_PO_STAVCI,
  brojArtikala,
  dodajStavku,
  izracunajDostavu,
  izracunajKorpu,
  nedostajuciIds,
  normalizujKolicinu,
  parsirajStavke,
  postaviKolicinu,
  ukloniStavku,
  type KorpaProizvod,
} from './cart';

const nordic = {
  id: 'brend-nordic',
  slug: 'nordic-labs',
  naziv: 'Nordic Labs',
  cijenaDostave: 600,
  pragBesplatneDostave: 8000,
};

const semichem = {
  id: 'brend-semichem',
  slug: 'semichem',
  naziv: 'SemiChem',
  cijenaDostave: 0,
  pragBesplatneDostave: null,
};

function proizvod(
  id: string,
  cijena: number,
  brend: KorpaProizvod['brend'] = nordic,
): KorpaProizvod {
  return { id, slug: id, naziv: id, cijena, slika: null, brend };
}

describe('normalizujKolicinu', () => {
  it('ograničava na raspon 1..MAX i odbacuje decimale', () => {
    expect(normalizujKolicinu(0)).toBe(1);
    expect(normalizujKolicinu(-5)).toBe(1);
    expect(normalizujKolicinu(2.7)).toBe(2);
    expect(normalizujKolicinu(1000)).toBe(MAX_KOLICINA_PO_STAVCI);
    expect(normalizujKolicinu(Number.NaN)).toBe(1);
  });
});

describe('dodajStavku', () => {
  it('dodaje novu stavku bez mijenjanja ulazne liste', () => {
    const stavke = [{ productId: 'a', kolicina: 1 }];
    const rezultat = dodajStavku(stavke, 'b', 2);

    expect(rezultat).toEqual([
      { productId: 'a', kolicina: 1 },
      { productId: 'b', kolicina: 2 },
    ]);
    expect(stavke).toHaveLength(1);
  });

  it('uvećava količinu postojeće stavke', () => {
    const rezultat = dodajStavku([{ productId: 'a', kolicina: 3 }], 'a', 2);
    expect(rezultat).toEqual([{ productId: 'a', kolicina: 5 }]);
  });

  it('ne prelazi maksimalnu količinu po stavci', () => {
    const rezultat = dodajStavku([{ productId: 'a', kolicina: 98 }], 'a', 10);
    expect(rezultat).toEqual([{ productId: 'a', kolicina: MAX_KOLICINA_PO_STAVCI }]);
  });
});

describe('postaviKolicinu i ukloniStavku', () => {
  it('postavlja tačnu količinu', () => {
    const rezultat = postaviKolicinu([{ productId: 'a', kolicina: 1 }], 'a', 4);
    expect(rezultat).toEqual([{ productId: 'a', kolicina: 4 }]);
  });

  it('uklanja stavku kad je količina manja od 1', () => {
    const rezultat = postaviKolicinu([{ productId: 'a', kolicina: 2 }], 'a', 0);
    expect(rezultat).toEqual([]);
  });

  it('uklanja samo traženu stavku', () => {
    const rezultat = ukloniStavku(
      [
        { productId: 'a', kolicina: 1 },
        { productId: 'b', kolicina: 1 },
      ],
      'a',
    );
    expect(rezultat).toEqual([{ productId: 'b', kolicina: 1 }]);
  });
});

describe('brojArtikala', () => {
  it('zbraja količine, ne broj redova', () => {
    expect(
      brojArtikala([
        { productId: 'a', kolicina: 2 },
        { productId: 'b', kolicina: 3 },
      ]),
    ).toBe(5);
  });
});

describe('parsirajStavke', () => {
  it('odbacuje neispravan ulaz umjesto da baci grešku', () => {
    expect(parsirajStavke(null)).toEqual([]);
    expect(parsirajStavke('korpa')).toEqual([]);
    expect(parsirajStavke([null, 42, { productId: '' }, { productId: 'a' }])).toEqual([]);
    expect(parsirajStavke([{ productId: 'a', kolicina: '2' }])).toEqual([]);
  });

  it('spaja duplikate i normalizuje količine', () => {
    expect(
      parsirajStavke([
        { productId: 'a', kolicina: 2 },
        { productId: 'a', kolicina: 3 },
        { productId: 'b', kolicina: -4 },
      ]),
    ).toEqual([
      { productId: 'a', kolicina: 5 },
      { productId: 'b', kolicina: 1 },
    ]);
  });
});

describe('izracunajDostavu', () => {
  it('naplaćuje dostavu ispod praga i prijavljuje razliku', () => {
    expect(izracunajDostavu(5000, nordic)).toEqual({
      dostava: 600,
      besplatnaDostava: false,
      doBesplatneDostave: 3000,
    });
  });

  it('oslobađa dostavu tačno na pragu', () => {
    expect(izracunajDostavu(8000, nordic)).toEqual({
      dostava: 0,
      besplatnaDostava: true,
      doBesplatneDostave: null,
    });
  });

  it('brend bez praga uvijek naplaćuje dostavu', () => {
    expect(izracunajDostavu(100000, { cijenaDostave: 600, pragBesplatneDostave: null })).toEqual({
      dostava: 600,
      besplatnaDostava: false,
      doBesplatneDostave: null,
    });
  });

  it('cijena dostave 0 znači besplatno bez obzira na prag', () => {
    expect(izracunajDostavu(100, semichem)).toEqual({
      dostava: 0,
      besplatnaDostava: true,
      doBesplatneDostave: null,
    });
  });
});

describe('izracunajKorpu', () => {
  it('lomi korpu na grupe po brendu i računa dostavu po grupi', () => {
    const proizvodi = [
      proizvod('p1', 3490),
      proizvod('p2', 2690),
      proizvod('p3', 2150, semichem),
    ];

    const korpa = izracunajKorpu(
      [
        { productId: 'p1', kolicina: 1 },
        { productId: 'p2', kolicina: 1 },
        { productId: 'p3', kolicina: 1 },
      ],
      proizvodi,
    );

    expect(korpa.grupe).toHaveLength(2);

    const [prva, druga] = korpa.grupe;
    expect(prva.brend.naziv).toBe('Nordic Labs');
    expect(prva.medjuzbir).toBe(3490 + 2690);
    expect(prva.dostava).toBe(600);
    expect(prva.doBesplatneDostave).toBe(8000 - (3490 + 2690));

    expect(druga.brend.naziv).toBe('SemiChem');
    expect(druga.dostava).toBe(0);
    expect(druga.besplatnaDostava).toBe(true);

    expect(korpa.medjuzbir).toBe(3490 + 2690 + 2150);
    expect(korpa.dostavaUkupno).toBe(600);
    expect(korpa.ukupno).toBe(korpa.medjuzbir + korpa.dostavaUkupno);
    expect(korpa.brojArtikala).toBe(3);
  });

  it('prelazak praga besplatne dostave ukida trošak dostave za taj brend', () => {
    const korpa = izracunajKorpu([{ productId: 'p1', kolicina: 3 }], [proizvod('p1', 3490)]);

    expect(korpa.grupe[0].medjuzbir).toBe(10470);
    expect(korpa.grupe[0].besplatnaDostava).toBe(true);
    expect(korpa.dostavaUkupno).toBe(0);
  });

  it('preskače stavke bez odgovarajućeg proizvoda', () => {
    const korpa = izracunajKorpu(
      [
        { productId: 'p1', kolicina: 1 },
        { productId: 'nepostojeci', kolicina: 5 },
      ],
      [proizvod('p1', 1000)],
    );

    expect(korpa.brojArtikala).toBe(1);
    expect(korpa.ukupno).toBe(1000 + 600);
  });

  it('prazna korpa daje nule, ne grešku', () => {
    expect(izracunajKorpu([], [])).toEqual({
      grupe: [],
      medjuzbir: 0,
      dostavaUkupno: 0,
      ukupno: 0,
      brojArtikala: 0,
    });
  });

  it('računa u cijelim feninzima', () => {
    const korpa = izracunajKorpu([{ productId: 'p1', kolicina: 3 }], [proizvod('p1', 3333)]);
    expect(Number.isInteger(korpa.ukupno)).toBe(true);
    expect(korpa.medjuzbir).toBe(9999);
  });
});

describe('nedostajuciIds', () => {
  it('vraća id-eve stavki koje baza ne poznaje', () => {
    expect(
      nedostajuciIds(
        [
          { productId: 'p1', kolicina: 1 },
          { productId: 'p9', kolicina: 1 },
        ],
        [proizvod('p1', 1000)],
      ),
    ).toEqual(['p9']);
  });
});
