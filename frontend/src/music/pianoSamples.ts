export const pianoSamples = Array.from({ length: 17 }, (_, i) => {
  const midi = 36 + i * 3;
  const names = ['C', 'Ds', 'Fs', 'A'];
  return { midi, url: `/audio/piano/${names[i % 4]}${Math.floor(midi / 12) - 1}.mp3` };
});
export function sampleFor(midi: number) {
  const sample = pianoSamples.reduce((best, next) =>
    Math.abs(next.midi - midi) < Math.abs(best.midi - midi) ? next : best,
  );
  return { ...sample, rate: 2 ** ((midi - sample.midi) / 12) };
}
