export interface LevainRatio {
  /** starter : flour : water */
  label: string;
  /** Total parts, e.g. 1:5:5 → 11. */
  parts: number;
  /** Minutes to peak at ~21 °C. */
  minutesToPeak: number;
  note: string;
}

export const RATIOS: readonly LevainRatio[] = [
  { label: '1:1:1', parts: 3, minutesToPeak: 270, note: 'Kraftig og syrlig. Topper fort og faller fort — smalt vindu. Krever at du er til stede.' },
  { label: '1:2:2', parts: 5, minutesToPeak: 360, note: 'Syrlig og rask. Grei når du bygger om morgenen og baker samme dag.' },
  { label: '1:3:3', parts: 7, minutesToPeak: 450, note: 'Balansert syre. Vanlig valg for en ettermiddagsbygging.' },
  { label: '1:4:4', parts: 9, minutesToPeak: 540, note: 'Mild. Klassisk for en kort natt, eller en treg starter rett fra kjøleskapet.' },
  { label: '1:5:5', parts: 11, minutesToPeak: 660, note: 'Mild, bredt vindu. Standard overnattingsbygg.' },
  { label: '1:6:6', parts: 13, minutesToPeak: 720, note: 'Mild og søtlig. Trygt for en full natt.' },
  { label: '1:8:8', parts: 17, minutesToPeak: 840, note: 'Veldig mild, lang natt. Krever en sprek starter for å komme i mål.' },
  { label: '1:10:10', parts: 21, minutesToPeak: 960, note: 'Mildest og lengst. Grensen for hva ett enkelt bygg klarer.' },
];

export function findRatio(label: string): LevainRatio | undefined {
  return RATIOS.find((r) => r.label === label);
}

/** The ratio whose time-to-peak is closest to the target. Ties go to the shorter one. */
export function closestRatio(targetMinutes: number): LevainRatio {
  let best = RATIOS[0]!;
  let bestDiff = Infinity;
  for (const r of RATIOS) {
    const diff = Math.abs(r.minutesToPeak - targetMinutes);
    if (diff < bestDiff) {
      best = r;
      bestDiff = diff;
    }
  }
  return best;
}
