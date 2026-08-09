const FENINGA_U_KM = 100;

export function formatCijena(feninzi: number): string {
  const km = (feninzi / 100).toFixed(2).replace('.', ',');
  return `${km} KM`;
}

/**
 * KM → fening. Novac u bazi je uvijek cijeli broj feninga, nikad `float`.
 *
 * Prihvata i decimalni zarez ("5,00") jer forma prima unos na bosanskom.
 * Vraća `NaN` kad ulaz nije broj (prazan string, slova) — pozivalac je
 * dužan validirati prije snimanja, da greška u unosu nikad ne postane 0.
 */
export function kmToFening(km: number | string): number {
  const broj = typeof km === 'number' ? km : Number(km.trim().replace(',', '.'));

  if (typeof km === 'string' && km.trim() === '') {
    return Number.NaN;
  }

  if (!Number.isFinite(broj)) {
    return Number.NaN;
  }

  return Math.round(broj * FENINGA_U_KM);
}

/**
 * Fening → KM, za pre-popunjavanje formi. Prikaz na dvije decimale radi
 * pozivalac (`toFixed(2)`); ovdje se vraća broj da ostane računljiv.
 */
export function feningToKm(fening: number): number {
  return Math.round(fening) / FENINGA_U_KM;
}
