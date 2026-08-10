import { describe, expect, it } from 'vitest';
import { razrijesiKategorijuIds, type KategorijaIzbor } from './shop-query';

const STABLO: KategorijaIzbor[] = [
  {
    id: 'sup',
    slug: 'suplementi',
    podkategorije: [
      { id: 'vit', slug: 'vitamini' },
      { id: 'min', slug: 'minerali' },
    ],
  },
  {
    id: 'hig',
    slug: 'higijena',
    podkategorije: [],
  },
];

describe('razrijesiKategorijuIds', () => {
  it('vraća null kad filtera nema', () => {
    expect(razrijesiKategorijuIds(STABLO, null)).toBeNull();
  });

  it('za top-level kategoriju vraća njen ID i ID-eve svih podkategorija', () => {
    expect(razrijesiKategorijuIds(STABLO, 'suplementi')).toEqual(['sup', 'vit', 'min']);
  });

  it('za podkategoriju vraća samo njen ID', () => {
    expect(razrijesiKategorijuIds(STABLO, 'vitamini')).toEqual(['vit']);
  });

  it('za top-level bez podkategorija vraća samo njen ID', () => {
    expect(razrijesiKategorijuIds(STABLO, 'higijena')).toEqual(['hig']);
  });

  it('nepoznat slug je filter bez rezultata, ne katalog bez filtera', () => {
    expect(razrijesiKategorijuIds(STABLO, 'ne-postoji')).toEqual([]);
  });
});
