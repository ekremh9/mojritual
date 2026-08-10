import { describe, expect, it } from 'vitest';
import {
  MAX_KRATKI_OPIS,
  normalizujProizvod,
  pripremiProizvod,
  validirajProizvod,
  type ProizvodUnos,
} from './product-form';

function unos(izmjene: Partial<ProizvodUnos> = {}): ProizvodUnos {
  return {
    naziv: 'Magnezij Bisglicinat',
    kratkiOpis: 'Visoko bioraspoloživi magnezij',
    opis: '',
    forma: 'kapsula',
    kategorije: ['vit'],
    sastojci: '',
    doziranje: '',
    upozorenja: '',
    cijenaKm: '24.90',
    staraCijenaKm: '',
    dostupnost: 'dostupno',
    ...izmjene,
  };
}

describe('normalizujProizvod', () => {
  it('trimuje tekst i filtrira kategorije na stringove', () => {
    const rezultat = normalizujProizvod({
      naziv: '  Magnezij  ',
      kategorije: ['a', 'b', 42, null],
    });

    expect(rezultat.naziv).toBe('Magnezij');
    expect(rezultat.kategorije).toEqual(['a', 'b']);
  });

  it('neispravan ulaz svodi na prazna polja umjesto da baci grešku', () => {
    expect(normalizujProizvod(null)).toEqual(unos({ naziv: '', kratkiOpis: '', forma: '', kategorije: [], cijenaKm: '' }));
    expect(normalizujProizvod({ kategorije: 'nije-niz' }).kategorije).toEqual([]);
  });

  it('nepoznatu dostupnost svodi na default "dostupno"', () => {
    expect(normalizujProizvod({ dostupnost: 'nepostojece' }).dostupnost).toBe('dostupno');
    expect(normalizujProizvod({ dostupnost: 'uskoro' }).dostupnost).toBe('uskoro');
  });
});

describe('validirajProizvod', () => {
  it('ispravan unos nema grešaka', () => {
    expect(validirajProizvod(unos())).toEqual({});
  });

  it('traži naziv, kratki opis, formu i kategoriju', () => {
    const greske = validirajProizvod(
      unos({ naziv: '', kratkiOpis: '', forma: '', kategorije: [] }),
    );

    expect(greske.naziv).toBeDefined();
    expect(greske.kratkiOpis).toBeDefined();
    expect(greske.forma).toBeDefined();
    expect(greske.kategorije).toBeDefined();
  });

  it('ograničava kratki opis na 200 karaktera', () => {
    expect(
      validirajProizvod(unos({ kratkiOpis: 'a'.repeat(MAX_KRATKI_OPIS) })).kratkiOpis,
    ).toBeUndefined();
    expect(
      validirajProizvod(unos({ kratkiOpis: 'a'.repeat(MAX_KRATKI_OPIS + 1) })).kratkiOpis,
    ).toBeDefined();
  });

  it('odbija formu koja nije u dozvoljenom skupu', () => {
    expect(validirajProizvod(unos({ forma: 'nepostojeca' })).forma).toBeDefined();
  });

  it('cijena mora biti unesena i veća od 0', () => {
    expect(validirajProizvod(unos({ cijenaKm: '' })).cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: '0' })).cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: '-5' })).cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: 'pet' })).cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: '24.90' })).cijenaKm).toBeUndefined();
  });

  it('stara cijena je opciona, ali mora biti veća od cijene kad je unesena', () => {
    expect(validirajProizvod(unos({ staraCijenaKm: '' })).staraCijenaKm).toBeUndefined();
    expect(
      validirajProizvod(unos({ cijenaKm: '24.90', staraCijenaKm: '20.00' })).staraCijenaKm,
    ).toBeDefined();
    expect(
      validirajProizvod(unos({ cijenaKm: '24.90', staraCijenaKm: '24.90' })).staraCijenaKm,
    ).toBeDefined();
    expect(
      validirajProizvod(unos({ cijenaKm: '24.90', staraCijenaKm: '29.90' })).staraCijenaKm,
    ).toBeUndefined();
  });
});

describe('pripremiProizvod', () => {
  it('novac pretvara u cijele feninge', () => {
    const vrijednosti = pripremiProizvod(unos({ cijenaKm: '24,90', staraCijenaKm: '29,90' }));

    expect(vrijednosti.cijena).toBe(2490);
    expect(vrijednosti.staraCijena).toBe(2990);
  });

  it('prazna opciona polja postaju null', () => {
    const vrijednosti = pripremiProizvod(
      unos({ opis: '  ', sastojci: '', doziranje: '', upozorenja: '', staraCijenaKm: '' }),
    );

    expect(vrijednosti.opis).toBeNull();
    expect(vrijednosti.sastojci).toBeNull();
    expect(vrijednosti.doziranje).toBeNull();
    expect(vrijednosti.upozorenja).toBeNull();
    expect(vrijednosti.staraCijena).toBeNull();
  });

  it('prenosi odabrane kategorije', () => {
    const vrijednosti = pripremiProizvod(unos({ kategorije: ['a', 'b'] }));
    expect(vrijednosti.kategorije).toEqual(['a', 'b']);
  });
});
