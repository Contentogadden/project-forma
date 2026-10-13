import type { Score, Tone } from './model';
import { pianoSamples, sampleFor } from './pianoSamples';

const buffers = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<AudioBuffer>>();
async function loadSample(ctx: AudioContext, url: string) {
  if (buffers.has(url)) return buffers.get(url)!;
  if (!pending.has(url))
    pending.set(
      url,
      (async () => {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Piano sample unavailable');
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        buffers.set(url, buffer);
        return buffer;
      })().finally(() => pending.delete(url)),
    );
  return pending.get(url)!;
}
type Voice = { source: AudioScheduledSourceNode; gain: GainNode; filter?: BiquadFilterNode };
export class MusicAudio {
  private context?: AudioContext;
  private bus?: GainNode;
  private analyser?: AnalyserNode;
  private voices = new Set<Voice>();
  private frame = 0;
  private generation = 0;
  private disposed = false;
  stop() {
    this.generation++;
    cancelAnimationFrame(this.frame);
    const now = this.context?.currentTime ?? 0;
    for (const voice of this.voices) {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setTargetAtTime(0, now, 0.005);
        voice.source.stop(now + 0.025);
      } catch {}
    }
    this.voices.clear();
  }
  volume(value: number) {
    if (this.bus && this.context)
      this.bus.gain.setTargetAtTime(
        Math.max(0, Math.min(1, value)) * 0.7,
        this.context.currentTime,
        0.025,
      );
  }
  private connect(source: AudioScheduledSourceNode, gain: GainNode, filter?: BiquadFilterNode) {
    const voice = { source, gain, filter };
    this.voices.add(voice);
    if (filter) {
      source.connect(filter);
      filter.connect(gain);
    } else source.connect(gain);
    gain.connect(this.bus!);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      filter?.disconnect();
      this.voices.delete(voice);
    };
  }
  async play(
    score: Score,
    tempo: number,
    tone: Tone,
    volume: number,
    metronome: boolean,
    progress: (step: number, level: number) => void,
    done: () => void,
    beatsPerBar = 4,
    loading?: (loaded: number, total: number) => void,
  ) {
    this.stop();
    const generation = this.generation;
    if (this.disposed) return;
    this.context ??= new AudioContext();
    const ctx = this.context;
    if (!this.bus) {
      this.bus = ctx.createGain();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 15;
      limiter.ratio.value = 4;
      this.bus.connect(limiter);
      limiter.connect(this.analyser);
      this.analyser.connect(ctx.destination);
    }
    await ctx.resume();
    const valid = () => generation === this.generation && !this.disposed;
    if (!valid()) return;
    let loaded = 0;
    loading?.(0, pianoSamples.length);
    try {
      await Promise.all(
        pianoSamples.map(async (sample) => {
          await loadSample(ctx, sample.url);
          loaded++;
          if (valid()) loading?.(loaded, pianoSamples.length);
        }),
      );
    } catch (error) {
      if (!valid()) return;
      this.stop();
      throw error;
    }
    if (!valid()) return;
    this.volume(volume);
    const start = ctx.currentTime + 0.04;
    const beat = 60 / tempo;
    for (const note of score.events) {
      const sample = sampleFor(note.midi);
      const source = ctx.createBufferSource();
      source.buffer = buffers.get(sample.url)!;
      source.playbackRate.value = sample.rate;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const at = start + note.beat * beat;
      const hold = note.duration * beat;
      const release = 0.32;
      const color = note.tone ?? tone;
      filter.type = 'lowpass';
      filter.frequency.value = color === 'reed' ? 3600 : color === 'bell' ? 14000 : 10000;
      const velocity = Math.max(0.05, Math.min(1, note.gain ?? 0.8));
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(velocity, at + 0.003);
      gain.gain.setValueAtTime(velocity, at + hold);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + hold + release);
      this.connect(source, gain, filter);
      source.start(at);
      source.stop(at + hold + release + 0.02);
    }
    if (metronome)
      for (let b = 0; b < score.beats; b++) {
        const source = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = start + b * beat;
        source.frequency.value = b % beatsPerBar === 0 ? 1200 : 850;
        gain.gain.setValueAtTime(0.07, at);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
        this.connect(source, gain);
        source.start(at);
        source.stop(at + 0.04);
      }
    const wave = new Float32Array(this.analyser!.fftSize);
    const end = Math.max(
      score.beats * beat,
      ...score.events.map((n) => (n.beat + n.duration) * beat + 0.34),
    );
    const tick = () => {
      if (!valid()) return;
      const elapsed = ctx.currentTime - start;
      if (elapsed >= end) {
        this.stop();
        progress(-1, 0);
        done();
        return;
      }
      this.analyser!.getFloatTimeDomainData(wave);
      const level = Math.sqrt(wave.reduce((sum, n) => sum + n * n, 0) / wave.length);
      progress(
        elapsed < 0 || elapsed >= score.beats * beat
          ? -1
          : Math.floor(elapsed / beat / score.stepBeats),
        level,
      );
      this.frame = requestAnimationFrame(tick);
    };
    tick();
  }
  dispose() {
    this.disposed = true;
    this.stop();
    void this.context?.close();
  }
}
