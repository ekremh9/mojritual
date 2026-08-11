import { describe, expect, it } from 'vitest';
import {
  normalizujCheckoutUnos,
  validirajCheckoutUnos,
  type CheckoutUnos,
} from './order-form';

function unos(izmjene: Partial<CheckoutUnos> = {}): CheckoutUnos {
  return {
    ime: 'Amina Hodžić',
    email: 'amina@example.com',
    telefon: '061 111 222',
    adresa: 'Ferhadija 1',
    grad: 'Sarajevo',
    postanskiBroj: '71000',
    napomena: '',
    ...izmjene,
  };
}

describe('normalizujCheckoutUnos', () => {
  it('trimuje tekst i email svodi na mala slova', () => {
    const rezultat = normalizujCheckoutUnos({
      ime: '  Amina Hodžić  ',
      email: '  AMINA@EXAMPLE.COM  ',
    });

    expect(rezultat.ime).toBe('Amina Hodžić');
    expect(rezultat.email).toBe('amina@example.com');
  });

  it('neispravan ulaz svodi na prazna polja umjesto da baci grešku', () => {
    expect(normalizujCheckoutUnos(null)).toEqual(unos({
      ime: '',
      email: '',
      telefon: '',
      adresa: '',
      grad: '',
      postanskiBroj: '',
      napomena: '',
    }));
    expect(normalizujCheckoutUnos(undefined).ime).toBe('');
  });
});

describe('validirajCheckoutUnos', () => {
  it('ispravan unos nema grešaka', () => {
    expect(validirajCheckoutUnos(unos())).toEqual({});
  });

  it('napomena je opciona', () => {
    expect(validirajCheckoutUnos(unos({ napomena: '' }))).toEqual({});
  });

  it('traži ime, email, telefon, adresu, grad i poštanski broj', () => {
    const greske = validirajCheckoutUnos(
      unos({ ime: '', email: '', telefon: '', adresa: '', grad: '', postanskiBroj: '' }),
    );

    expect(greske.ime).toBeDefined();
    expect(greske.email).toBeDefined();
    expect(greske.telefon).toBeDefined();
    expect(greske.adresa).toBeDefined();
    expect(greske.grad).toBeDefined();
    expect(greske.postanskiBroj).toBeDefined();
  });

  it('odbija neispravan email format', () => {
    const greske = validirajCheckoutUnos(unos({ email: 'nije-email' }));
    expect(greske.email).toBeDefined();
  });
});
