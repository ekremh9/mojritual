import { describe, expect, it } from 'vitest';
import {
  MAX_KRATKI_OPIS,
  normalizujBrandProfil,
  normalizujWeb,
  pripremiBrandProfil,
  validirajBrandProfil,
  type BrandProfilUnos,
} from './brand-profile';
import { feningToKm, kmToFening } from './format';

function unos(izmjene: Partial<BrandProfilUnos> = {}): BrandProfilUnos {
  return {
    naziv: 'Nordic Labs',
    kratkiOpis: 'Skandinavski suplementi',
    prica: '',
    web: '',
    email: '',
    telefon: '',
    jib: '4200000000001',
    pdvBroj: '',
    adresa: '',
    cijenaDostaveKm: '6.00',
    pragBesplatneDostaveKm: '80.00',
    nemaBesplatneDostave: false,
    wholesaleDefaults: [],
    ...izmjene,
  };
}

describe('kmToFening', () => {
  it('pretvara KM u cijele feninge', () => {
    expect(kmToFening(5)).toBe(500);
    expect(kmToFening('6.00')).toBe(600);
    expect(kmToFening('0')).toBe(0);
    expect(kmToFening(24.9)).toBe(2490);
  });

  it('prihvata decimalni zarez iz bosanskog unosa', () => {
    expect(kmToFening('5,50')).toBe(550);
  });

  it('zaokružuje na cijeli fening umjesto da vrati float', () => {
    const rezultat = kmToFening('3.333');
    expect(rezultat).toBe(333);
    expect(Number.isInteger(rezultat)).toBe(true);
  });

  it('vraća NaN za prazan ili neispravan unos, ne 0', () => {
    expect(kmToFening('')).toBeNaN();
    expect(kmToFening('   ')).toBeNaN();
    expect(kmToFening('besplatno')).toBeNaN();
    expect(kmToFening(Number.NaN)).toBeNaN();
  });
});

describe('feningToKm', () => {
  it('vraća iznos u KM', () => {
    expect(feningToKm(600)).toBe(6);
    expect(feningToKm(2490)).toBe(24.9);
    expect(feningToKm(0)).toBe(0);
  });

  it('zatvara krug s kmToFening', () => {
    expect(kmToFening(feningToKm(1234))).toBe(1234);
  });
});

describe('normalizujWeb', () => {
  it('dopunjava protokol', () => {
    expect(normalizujWeb('nordiclabs.ba')).toBe('https://nordiclabs.ba');
  });

  it('ne dira adresu koja već ima protokol', () => {
    expect(normalizujWeb('http://nordiclabs.ba')).toBe('http://nordiclabs.ba');
  });

  it('prazno ostaje prazno', () => {
    expect(normalizujWeb('   ')).toBe('');
  });
});

describe('normalizujBrandProfil', () => {
  it('trimuje tekst i spušta email na mala slova', () => {
    const rezultat = normalizujBrandProfil({
      naziv: '  Nordic Labs  ',
      email: '  Kontakt@Nordic.BA ',
      nemaBesplatneDostave: true,
    });

    expect(rezultat.naziv).toBe('Nordic Labs');
    expect(rezultat.email).toBe('kontakt@nordic.ba');
    expect(rezultat.nemaBesplatneDostave).toBe(true);
  });

  it('neispravan ulaz svodi na prazna polja umjesto da baci grešku', () => {
    expect(normalizujBrandProfil(null)).toEqual(
      unos({
        naziv: '',
        kratkiOpis: '',
        jib: '',
        cijenaDostaveKm: '',
        pragBesplatneDostaveKm: '',
      }),
    );
    expect(normalizujBrandProfil({ naziv: 42, nemaBesplatneDostave: 'da' }).naziv).toBe('');
    expect(normalizujBrandProfil({ nemaBesplatneDostave: 'da' }).nemaBesplatneDostave).toBe(false);
  });
});

describe('validirajBrandProfil', () => {
  it('ispravan unos nema grešaka', () => {
    expect(validirajBrandProfil(unos())).toEqual({});
  });

  it('traži naziv, kratki opis i JIB', () => {
    const greske = validirajBrandProfil(unos({ naziv: '', kratkiOpis: '', jib: '' }));

    expect(greske.naziv).toBeDefined();
    expect(greske.kratkiOpis).toBeDefined();
    expect(greske.jib).toBeDefined();
  });

  it('ograničava kratki opis na 200 karaktera', () => {
    expect(validirajBrandProfil(unos({ kratkiOpis: 'a'.repeat(MAX_KRATKI_OPIS) })).kratkiOpis)
      .toBeUndefined();
    expect(
      validirajBrandProfil(unos({ kratkiOpis: 'a'.repeat(MAX_KRATKI_OPIS + 1) })).kratkiOpis,
    ).toBeDefined();
  });

  it('email i web validira samo kad su uneseni', () => {
    expect(validirajBrandProfil(unos({ email: '', web: '' })).email).toBeUndefined();
    expect(validirajBrandProfil(unos({ email: 'nije-email' })).email).toBeDefined();
    expect(validirajBrandProfil(unos({ email: 'kontakt@nordic.ba' })).email).toBeUndefined();
    expect(validirajBrandProfil(unos({ web: 'nordiclabs' })).web).toBeDefined();
    expect(validirajBrandProfil(unos({ web: 'nordiclabs.ba' })).web).toBeUndefined();
  });

  it('traži cijenu dostave i kad je nula (spec 10.5)', () => {
    expect(validirajBrandProfil(unos({ cijenaDostaveKm: '' })).cijenaDostaveKm).toBeDefined();
    expect(validirajBrandProfil(unos({ cijenaDostaveKm: '0' })).cijenaDostaveKm).toBeUndefined();
  });

  it('odbija negativne i nebrojčane iznose', () => {
    expect(validirajBrandProfil(unos({ cijenaDostaveKm: '-1' })).cijenaDostaveKm).toBeDefined();
    expect(validirajBrandProfil(unos({ cijenaDostaveKm: 'pet' })).cijenaDostaveKm).toBeDefined();
    expect(
      validirajBrandProfil(unos({ pragBesplatneDostaveKm: '-5' })).pragBesplatneDostaveKm,
    ).toBeDefined();
  });

  it('prag mora biti iznos ili izričito „nema besplatne dostave"', () => {
    expect(
      validirajBrandProfil(unos({ pragBesplatneDostaveKm: '' })).pragBesplatneDostaveKm,
    ).toBeDefined();
    expect(
      validirajBrandProfil(unos({ pragBesplatneDostaveKm: '', nemaBesplatneDostave: true }))
        .pragBesplatneDostaveKm,
    ).toBeUndefined();
  });

  describe('wholesaleDefaults', () => {
    it('nedostavljeni pragovi (undefined ili prazan niz) ne prave grešku — opciono polje', () => {
      expect(validirajBrandProfil(unos({ wholesaleDefaults: undefined })).wholesaleDefaults).toBeUndefined();
      expect(validirajBrandProfil(unos({ wholesaleDefaults: [] })).wholesaleDefaults).toBeUndefined();
    });

    it('primjenjuje ista pravila kao pragovi po proizvodu (dijeljena validirajWholesalePragove)', () => {
      expect(
        validirajBrandProfil(
          unos({
            wholesaleDefaults: [
              { minKolicina: 50, popustPosto: 10 },
              { minKolicina: 200, popustPosto: 15 },
            ],
          }),
        ).wholesaleDefaults,
      ).toBeUndefined();

      expect(
        validirajBrandProfil(
          unos({
            wholesaleDefaults: [
              { minKolicina: 200, popustPosto: 15 },
              { minKolicina: 50, popustPosto: 10 },
            ],
          }),
        ).wholesaleDefaults,
      ).toBeDefined();
    });
  });
});

describe('pripremiBrandProfil', () => {
  it('novac pretvara u cijele feninge', () => {
    const vrijednosti = pripremiBrandProfil(
      unos({ cijenaDostaveKm: '6,00', pragBesplatneDostaveKm: '79.90' }),
    );

    expect(vrijednosti.cijenaDostave).toBe(600);
    expect(vrijednosti.pragBesplatneDostave).toBe(7990);
  });

  it('„nema besplatne dostave" postavlja prag na null', () => {
    const vrijednosti = pripremiBrandProfil(
      unos({ pragBesplatneDostaveKm: '80.00', nemaBesplatneDostave: true }),
    );

    expect(vrijednosti.pragBesplatneDostave).toBeNull();
  });

  it('prazna opciona polja postaju null, a web dobija protokol', () => {
    const vrijednosti = pripremiBrandProfil(
      unos({ prica: '  ', pdvBroj: '', adresa: '', web: 'nordiclabs.ba', email: 'A@B.ba' }),
    );

    expect(vrijednosti.prica).toBeNull();
    expect(vrijednosti.pdvBroj).toBeNull();
    expect(vrijednosti.adresa).toBeNull();
    expect(vrijednosti.web).toBe('https://nordiclabs.ba');
    expect(vrijednosti.email).toBe('a@b.ba');
  });
});
