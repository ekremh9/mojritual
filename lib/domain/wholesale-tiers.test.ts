import { describe, expect, it } from 'vitest';
import { nizWholesalePragova, validirajWholesalePragove, type WholesalePragoviPoruke } from './wholesale-tiers';

const PORUKE: WholesalePragoviPoruke = {
  max: 'max',
  kolicinaNeispravna: 'kolicina-neispravna',
  kolicinaRastuce: 'kolicina-rastuce',
  popustNeispravan: 'popust-neispravan',
  popustRastuce: 'popust-rastuce',
};

describe('nizWholesalePragova', () => {
  it('vraća prazan niz za bilo šta što nije niz', () => {
    expect(nizWholesalePragova(undefined)).toEqual([]);
    expect(nizWholesalePragova(null)).toEqual([]);
    expect(nizWholesalePragova('nije niz')).toEqual([]);
  });

  it('konvertuje stringove u brojeve, ne odbacuje/skraćuje niz', () => {
    expect(nizWholesalePragova([{ minKolicina: '50', popustPosto: '10' }])).toEqual([
      { minKolicina: 50, popustPosto: 10 },
    ]);
  });

  it('nedostajuće/neispravno polje postaje NaN, ne baca grešku', () => {
    expect(nizWholesalePragova([{}])).toEqual([
      { minKolicina: Number.NaN, popustPosto: Number.NaN },
    ]);
    expect(nizWholesalePragova(['nije objekat'])).toEqual([
      { minKolicina: Number.NaN, popustPosto: Number.NaN },
    ]);
  });

  it('ne skraćuje niz duži od 3 — to je posao validacije', () => {
    const cetiri = [
      { minKolicina: 1, popustPosto: 1 },
      { minKolicina: 2, popustPosto: 2 },
      { minKolicina: 3, popustPosto: 3 },
      { minKolicina: 4, popustPosto: 4 },
    ];
    expect(nizWholesalePragova(cetiri)).toHaveLength(4);
  });
});

describe('validirajWholesalePragove', () => {
  it('undefined ili prazan niz je validan (opciono polje)', () => {
    expect(validirajWholesalePragove(undefined, PORUKE)).toBeUndefined();
    expect(validirajWholesalePragove([], PORUKE)).toBeUndefined();
  });

  it('prihvata 1, 2 ili 3 ispravna rastuća praga', () => {
    expect(
      validirajWholesalePragove([{ minKolicina: 50, popustPosto: 10 }], PORUKE),
    ).toBeUndefined();

    expect(
      validirajWholesalePragove(
        [
          { minKolicina: 50, popustPosto: 10 },
          { minKolicina: 200, popustPosto: 15 },
          { minKolicina: 1000, popustPosto: 25 },
        ],
        PORUKE,
      ),
    ).toBeUndefined();
  });

  it('odbija više od 3 praga', () => {
    const greska = validirajWholesalePragove(
      [
        { minKolicina: 10, popustPosto: 1 },
        { minKolicina: 20, popustPosto: 2 },
        { minKolicina: 30, popustPosto: 3 },
        { minKolicina: 40, popustPosto: 4 },
      ],
      PORUKE,
    );
    expect(greska).toBe(PORUKE.max);
  });

  it('minKolicina mora biti pozitivan cijeli broj', () => {
    expect(
      validirajWholesalePragove([{ minKolicina: 0, popustPosto: 10 }], PORUKE),
    ).toBe(PORUKE.kolicinaNeispravna);
    expect(
      validirajWholesalePragove([{ minKolicina: -5, popustPosto: 10 }], PORUKE),
    ).toBe(PORUKE.kolicinaNeispravna);
    expect(
      validirajWholesalePragove([{ minKolicina: 10.5, popustPosto: 10 }], PORUKE),
    ).toBe(PORUKE.kolicinaNeispravna);
    expect(
      validirajWholesalePragove([{ minKolicina: Number.NaN, popustPosto: 10 }], PORUKE),
    ).toBe(PORUKE.kolicinaNeispravna);
  });

  it('popustPosto mora biti broj od 0 do 100 (granice uključene)', () => {
    expect(
      validirajWholesalePragove([{ minKolicina: 50, popustPosto: -1 }], PORUKE),
    ).toBe(PORUKE.popustNeispravan);
    expect(
      validirajWholesalePragove([{ minKolicina: 50, popustPosto: 101 }], PORUKE),
    ).toBe(PORUKE.popustNeispravan);
    expect(validirajWholesalePragove([{ minKolicina: 50, popustPosto: 0 }], PORUKE)).toBeUndefined();
    expect(validirajWholesalePragove([{ minKolicina: 50, popustPosto: 100 }], PORUKE)).toBeUndefined();
  });

  it('odbija pragove količine koji nisu strogo rastući', () => {
    expect(
      validirajWholesalePragove(
        [
          { minKolicina: 50, popustPosto: 10 },
          { minKolicina: 50, popustPosto: 15 },
        ],
        PORUKE,
      ),
    ).toBe(PORUKE.kolicinaRastuce);

    expect(
      validirajWholesalePragove(
        [
          { minKolicina: 200, popustPosto: 10 },
          { minKolicina: 50, popustPosto: 15 },
        ],
        PORUKE,
      ),
    ).toBe(PORUKE.kolicinaRastuce);
  });

  it('dozvoljava jednak popust kod većeg praga, ali odbija manji popust kod većeg praga', () => {
    expect(
      validirajWholesalePragove(
        [
          { minKolicina: 50, popustPosto: 10 },
          { minKolicina: 200, popustPosto: 10 },
        ],
        PORUKE,
      ),
    ).toBeUndefined();

    expect(
      validirajWholesalePragove(
        [
          { minKolicina: 50, popustPosto: 15 },
          { minKolicina: 200, popustPosto: 10 },
        ],
        PORUKE,
      ),
    ).toBe(PORUKE.popustRastuce);
  });
});
