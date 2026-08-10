import { describe, expect, it } from 'vitest';
import { generisiSlug } from './slug';

describe('generisiSlug', () => {
  it('pretvara u kebab-case mala slova', () => {
    expect(generisiSlug('Magnezij Bisglicinat')).toBe('magnezij-bisglicinat');
  });

  it('uklanja bosansku dijakritiku', () => {
    expect(generisiSlug('Čaj za probavu')).toBe('caj-za-probavu');
    expect(generisiSlug('Žvakaće vitamin C')).toBe('zvakace-vitamin-c');
    expect(generisiSlug('Šumsko voće i đumbir')).toBe('sumsko-voce-i-djumbir');
  });

  it('zamjenjuje niz nealfanumeričkih znakova jednom crticom', () => {
    expect(generisiSlug('B-Kompleks Forte!!  (60 kapsula)')).toBe('b-kompleks-forte-60-kapsula');
  });

  it('uklanja vodeće i prateće crtice', () => {
    expect(generisiSlug('  -Vitamin D3-  ')).toBe('vitamin-d3');
  });
});
