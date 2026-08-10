import { describe, expect, it } from 'vitest';
import { sloziKategorijeStablo, type KategorijaRed } from './categories';

function red(dio: Partial<KategorijaRed> & { id: string; slug: string }): KategorijaRed {
  return {
    naziv: dio.slug,
    opis: null,
    parentId: null,
    ikona: null,
    redoslijed: 0,
    ...dio,
  };
}

const SUPLEMENTI = red({ id: 'sup', slug: 'suplementi', naziv: 'Suplementi', redoslijed: 1 });
const VITAMINI = red({ id: 'vit', slug: 'vitamini', naziv: 'Vitamini', parentId: 'sup' });
const MINERALI = red({ id: 'min', slug: 'minerali', naziv: 'Minerali', parentId: 'sup' });
const SPORT = red({ id: 'spo', slug: 'sport', naziv: 'Sport', redoslijed: 2 });
const PROTEINI = red({ id: 'pro', slug: 'proteini', naziv: 'Proteini', parentId: 'spo' });

describe('sloziKategorijeStablo', () => {
  it('veže podkategorije za roditelja', () => {
    const stablo = sloziKategorijeStablo(
      [SUPLEMENTI, VITAMINI, MINERALI],
      new Map([
        ['vit', 3],
        ['min', 2],
      ]),
      new Map([['sup', 5]]),
    );

    expect(stablo).toHaveLength(1);
    expect(stablo[0]?.slug).toBe('suplementi');
    expect(stablo[0]?.brojProizvoda).toBe(5);
    expect(stablo[0]?.podkategorije.map((pod) => pod.slug)).toEqual(['minerali', 'vitamini']);
  });

  it('izostavlja top-level kategoriju bez ijednog proizvoda u podstablu', () => {
    const stablo = sloziKategorijeStablo(
      [SUPLEMENTI, VITAMINI, SPORT, PROTEINI],
      new Map([['vit', 3]]),
      new Map([['sup', 3]]),
    );

    expect(stablo.map((kategorija) => kategorija.slug)).toEqual(['suplementi']);
  });

  it('izostavlja praznu podkategoriju, ali zadržava roditelja', () => {
    const stablo = sloziKategorijeStablo(
      [SUPLEMENTI, VITAMINI, MINERALI],
      new Map([['vit', 3]]),
      new Map([['sup', 3]]),
    );

    expect(stablo[0]?.podkategorije.map((pod) => pod.slug)).toEqual(['vitamini']);
  });

  it('zadržava roditelja čiji proizvodi vise direktno na njemu', () => {
    const stablo = sloziKategorijeStablo(
      [SUPLEMENTI],
      new Map([['sup', 4]]),
      new Map([['sup', 4]]),
    );

    expect(stablo[0]?.brojProizvoda).toBe(4);
    expect(stablo[0]?.podkategorije).toEqual([]);
  });

  it('ne zbraja djecu — broj podstabla dolazi iz deduplicirane mape', () => {
    // Isti proizvod u dvije podkategorije: 3 + 2 bi dalo 5, tačno je 4.
    const stablo = sloziKategorijeStablo(
      [SUPLEMENTI, VITAMINI, MINERALI],
      new Map([
        ['vit', 3],
        ['min', 2],
      ]),
      new Map([['sup', 4]]),
    );

    expect(stablo[0]?.brojProizvoda).toBe(4);
  });

  it('poštuje redoslijed pa naziv, bez obzira na redoslijed ulaza', () => {
    const stablo = sloziKategorijeStablo(
      [SPORT, PROTEINI, SUPLEMENTI, VITAMINI],
      new Map([
        ['vit', 1],
        ['pro', 1],
      ]),
      new Map([
        ['sup', 1],
        ['spo', 1],
      ]),
    );

    expect(stablo.map((kategorija) => kategorija.slug)).toEqual(['suplementi', 'sport']);
  });
});
