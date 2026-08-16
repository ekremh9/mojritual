import { describe, expect, it } from 'vitest';
import {
  MAX_KRATKI_OPIS,
  NAZIV_PLACEHOLDER,
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
    istaknutZahtjev: false,
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

  it('istaknutZahtjev je true samo kad je poslano tačno boolean true', () => {
    expect(normalizujProizvod({ istaknutZahtjev: true }).istaknutZahtjev).toBe(true);
    expect(normalizujProizvod({ istaknutZahtjev: false }).istaknutZahtjev).toBe(false);
    expect(normalizujProizvod({ istaknutZahtjev: 'true' }).istaknutZahtjev).toBe(false);
    expect(normalizujProizvod({}).istaknutZahtjev).toBe(false);
  });
});

describe('validirajProizvod', () => {
  it('ispravan unos nema grešaka', () => {
    expect(validirajProizvod(unos(), 'na_cekanju')).toEqual({});
  });

  it('traži naziv, kratki opis, formu i kategoriju', () => {
    const greske = validirajProizvod(
      unos({ naziv: '', kratkiOpis: '', forma: '', kategorije: [] }),
      'na_cekanju',
    );

    expect(greske.naziv).toBeDefined();
    expect(greske.kratkiOpis).toBeDefined();
    expect(greske.forma).toBeDefined();
    expect(greske.kategorije).toBeDefined();
  });

  it('ograničava kratki opis na 200 karaktera', () => {
    expect(
      validirajProizvod(unos({ kratkiOpis: 'a'.repeat(MAX_KRATKI_OPIS) }), 'na_cekanju').kratkiOpis,
    ).toBeUndefined();
    expect(
      validirajProizvod(unos({ kratkiOpis: 'a'.repeat(MAX_KRATKI_OPIS + 1) }), 'na_cekanju')
        .kratkiOpis,
    ).toBeDefined();
  });

  it('odbija formu koja nije u dozvoljenom skupu', () => {
    expect(validirajProizvod(unos({ forma: 'nepostojeca' }), 'na_cekanju').forma).toBeDefined();
  });

  it('cijena mora biti unesena i veća od 0', () => {
    expect(validirajProizvod(unos({ cijenaKm: '' }), 'na_cekanju').cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: '0' }), 'na_cekanju').cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: '-5' }), 'na_cekanju').cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: 'pet' }), 'na_cekanju').cijenaKm).toBeDefined();
    expect(validirajProizvod(unos({ cijenaKm: '24.90' }), 'na_cekanju').cijenaKm).toBeUndefined();
  });

  it('stara cijena je opciona, ali mora biti veća od cijene kad je unesena', () => {
    expect(
      validirajProizvod(unos({ staraCijenaKm: '' }), 'na_cekanju').staraCijenaKm,
    ).toBeUndefined();
    expect(
      validirajProizvod(unos({ cijenaKm: '24.90', staraCijenaKm: '20.00' }), 'na_cekanju')
        .staraCijenaKm,
    ).toBeDefined();
    expect(
      validirajProizvod(unos({ cijenaKm: '24.90', staraCijenaKm: '24.90' }), 'na_cekanju')
        .staraCijenaKm,
    ).toBeDefined();
    expect(
      validirajProizvod(unos({ cijenaKm: '24.90', staraCijenaKm: '29.90' }), 'na_cekanju')
        .staraCijenaKm,
    ).toBeUndefined();
  });

  it('dozvoljava placeholder naziv nacrta kad se sprema kao nacrt', () => {
    const greske = validirajProizvod(unos({ naziv: NAZIV_PLACEHOLDER }), 'nacrt');
    expect(greske.naziv).toBeUndefined();
  });

  it('odbija placeholder naziv nacrta kad se šalje na odobrenje', () => {
    const greske = validirajProizvod(unos({ naziv: NAZIV_PLACEHOLDER }), 'na_cekanju');
    expect(greske.naziv).toBeDefined();
  });

  it('placeholder naziv sa dodatnim razmacima se i dalje prepoznaje', () => {
    const greske = validirajProizvod(unos({ naziv: `  ${NAZIV_PLACEHOLDER}  ` }), 'na_cekanju');
    expect(greske.naziv).toBeDefined();
  });

  it('nacrt sa potpuno praznim poljima prolazi bez grešaka', () => {
    const greske = validirajProizvod(
      unos({
        naziv: 'Bilo šta',
        kratkiOpis: '',
        opis: '',
        forma: '',
        kategorije: [],
        sastojci: '',
        doziranje: '',
        upozorenja: '',
        cijenaKm: '',
        staraCijenaKm: '',
        dostupnost: '',
      }),
      'nacrt',
    );
    expect(greske).toEqual({});
  });

  it('nacrt sa placeholder nazivom prolazi bez grešaka', () => {
    const greske = validirajProizvod(unos({ naziv: NAZIV_PLACEHOLDER }), 'nacrt');
    expect(greske).toEqual({});
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

  it('prenosi istaknutZahtjev bez izmjene', () => {
    expect(pripremiProizvod(unos({ istaknutZahtjev: true })).istaknutZahtjev).toBe(true);
    expect(pripremiProizvod(unos({ istaknutZahtjev: false })).istaknutZahtjev).toBe(false);
  });
});
