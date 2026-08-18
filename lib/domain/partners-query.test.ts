import { describe, expect, it } from 'vitest';
import { parsePartneriParams, sortPartnere, type PartnerZaSortiranje } from './partners-query';

describe('parsePartneriParams', () => {
  it('vraća podrazumijevane vrijednosti kad nema parametara', () => {
    expect(parsePartneriParams({})).toEqual({ q: null, sort: 'preporuceno' });
  });

  it('trimuje i normalizuje q', () => {
    expect(parsePartneriParams({ q: '  nordic  ' })).toEqual({ q: 'nordic', sort: 'preporuceno' });
  });

  it('prazan q postaje null', () => {
    expect(parsePartneriParams({ q: '   ' }).q).toBeNull();
  });

  it('nepoznat sort pada na podrazumijevani', () => {
    expect(parsePartneriParams({ sort: 'nepostojeci' }).sort).toBe('preporuceno');
  });

  it('prihvata poznat sort', () => {
    expect(parsePartneriParams({ sort: 'naziv' }).sort).toBe('naziv');
  });
});

describe('sortPartnere', () => {
  const partneri: PartnerZaSortiranje[] = [
    { naziv: 'Zeta', verifikovan: false, brojProizvoda: 5, createdAt: new Date('2026-01-01') },
    { naziv: 'Alfa', verifikovan: true, brojProizvoda: 2, createdAt: new Date('2026-03-01') },
    { naziv: 'Beta', verifikovan: true, brojProizvoda: 10, createdAt: new Date('2026-02-01') },
  ];

  it('naziv sortira alfabetski', () => {
    expect(sortPartnere(partneri, 'naziv').map((p) => p.naziv)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('novo sortira po createdAt opadajuće', () => {
    expect(sortPartnere(partneri, 'novo').map((p) => p.naziv)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('preporuceno stavlja verifikovane prvo, pa najviše proizvoda', () => {
    expect(sortPartnere(partneri, 'preporuceno').map((p) => p.naziv)).toEqual([
      'Beta',
      'Alfa',
      'Zeta',
    ]);
  });

  it('ne mijenja ulazni niz', () => {
    const kopija = [...partneri];
    sortPartnere(partneri, 'naziv');
    expect(partneri).toEqual(kopija);
  });
});
