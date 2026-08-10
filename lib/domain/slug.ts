/**
 * Generisanje slug-a iz naziva — čista funkcija, bez DB pristupa.
 * Jedinstvenost (dodavanje broja kod poklapanja) rješava pozivalac, jer
 * traži provjeru u bazi.
 */

// Unicode kombinujući dijakritički znakovi (combining diacritical marks),
// opseg 0x0300-0x036F — ono što `normalize('NFD')` odvoji od slova.
const COMBINING_MARKS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g',
);

const DIJAKRITIKA: Record<string, string> = {
  č: 'c',
  ć: 'c',
  š: 's',
  ž: 'z',
  đ: 'dj',
};

export function generisiSlug(naziv: string): string {
  const bezDijakritike = naziv
    .toLowerCase()
    .replace(/[čćšžđ]/g, (znak) => DIJAKRITIKA[znak] ?? znak);

  return bezDijakritike
    .normalize('NFD')
    .replace(COMBINING_MARKS, '') // ostale dijakritike (npr. iz stranih naziva)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
