export function formatCijena(feninzi: number): string {
  const km = (feninzi / 100).toFixed(2).replace('.', ',');
  return `${km} KM`;
}
