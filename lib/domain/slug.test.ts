import { describe, expect, it } from 'vitest';
import { generisiSlug, izvediSlugBazu } from './slug';

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

describe('izvediSlugBazu', () => {
  it('koristi generisani slug kad naziv daje upotrebljiv rezultat', () => {
    expect(izvediSlugBazu('Magnezij Bisglicinat')).toBe('magnezij-bisglicinat');
  });

  it('prazan naziv ne proizvodi prazan slug, nego nasumičan nacrt- fallback', () => {
    const slug = izvediSlugBazu('');
    expect(slug).not.toBe('');
    expect(slug).toMatch(/^nacrt-[a-z0-9]+$/);
  });

  it('naziv bez alfanumeričkih znakova (npr. samo interpunkcija) takođe pada na fallback', () => {
    const slug = izvediSlugBazu('!!!   ---');
    expect(slug).not.toBe('');
    expect(slug).toMatch(/^nacrt-[a-z0-9]+$/);
  });

  it('svaki fallback poziv daje drugačiji slug (izbjegava sudar dva prazna naziva)', () => {
    expect(izvediSlugBazu('')).not.toBe(izvediSlugBazu(''));
  });
});
