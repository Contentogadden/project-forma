import type { Score } from './model.ts';
export const noteLabel = (midi: number) =>
  `${['До', 'До♯', 'Ре', 'Ми♭', 'Ми', 'Фа', 'Фа♯', 'Соль', 'Ля♭', 'Ля', 'Си♭', 'Си'][((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
export const melody = (notes: number[], step = 1): Score => ({
  events: notes.map((midi, i) => ({ midi, beat: i * step, duration: step * 0.8 })),
  beats: notes.length * step,
  stepBeats: step,
});
export const voices = (lower: number[], upper: number[]): Score => ({
  events: lower.flatMap((midi, i) => [
    { midi, beat: i * 2, duration: 1.8, gain: 0.6 },
    { midi: upper[i], beat: i * 2, duration: 1.8, gain: 0.75 },
  ]),
  beats: lower.length * 2,
  stepBeats: 2,
});
export const chord = (notes: number[]): Score => ({
  events: notes.map((midi) => ({ midi, beat: 0, duration: 1.8, gain: 0.55 })),
  beats: 2,
  stepBeats: 1,
});
