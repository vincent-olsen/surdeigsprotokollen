/** Norwegian number formatting: decimal comma, space before units. */

export function grams(n: number): string {
  return `${Math.round(n)} g`;
}

export function decimal(n: number, decimals = 2): string {
  return n.toFixed(decimals).replace('.', ',');
}

export function percent(n: number, decimals = 0): string {
  return `${decimal(n, decimals)} %`;
}
