import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const transpile = (path) =>
  ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
const dataUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const samplesUrl = dataUrl(transpile('../src/music/pianoSamples.ts'));
let serial = 0;
async function setup(t, fetcher) {
  const sources = [];
  const oscillators = [];
  const contexts = [];
  const callbacks = new Map();
  let frames = 0;
  let fetches = 0;
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {},
  });
  const node = () => ({ connect() {}, disconnect() {} });
  const source = () => ({
    ...node(),
    playbackRate: param(),
    frequency: param(),
    starts: [],
    stops: [],
    start(at) {
      this.starts.push(at);
    },
    stop(at) {
      this.stops.push(at);
    },
  });
  class Context {
    constructor() {
      contexts.push(this);
    }
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() {}
    async decodeAudioData() {
      return { duration: 8 };
    }
    createGain() {
      return { ...node(), gain: param() };
    }
    createBiquadFilter() {
      return { ...node(), frequency: param() };
    }
    createDynamicsCompressor() {
      return { ...node(), threshold: param(), knee: param(), ratio: param() };
    }
    createAnalyser() {
      return {
        ...node(),
        fftSize: 512,
        getFloatTimeDomainData(wave) {
          wave.fill(0.01);
        },
      };
    }
    createBufferSource() {
      const s = source();
      sources.push(s);
      return s;
    }
    createOscillator() {
      const s = source();
      oscillators.push(s);
      return s;
    }
  }
  t.mock.method(globalThis, 'fetch', async () => {
    fetches++;
    return fetcher ? fetcher() : { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  });
  for (const [name, value] of Object.entries({
    AudioContext: Context,
    requestAnimationFrame: (fn) => {
      callbacks.set(++frames, fn);
      return frames;
    },
    cancelAnimationFrame: (id) => callbacks.delete(id),
  })) {
    const old = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => {
      if (old) Object.defineProperty(globalThis, name, old);
      else delete globalThis[name];
    });
  }
  const code = transpile('../src/music/audio.ts').replace(
    "'./pianoSamples'",
    JSON.stringify(samplesUrl),
  );
  const { MusicAudio } = await import(dataUrl(`${code}\n// test ${serial++}`));
  return {
    engine: new MusicAudio(),
    sources,
    oscillators,
    get fetches() {
      return fetches;
    },
    advance(time) {
      contexts[0].currentTime = time;
      const queued = [...callbacks.values()];
      callbacks.clear();
      queued.forEach((fn) => fn());
    },
  };
}
const score = {
  events: [
    { midi: 60, beat: 0, duration: 0.8 },
    { midi: 64, beat: 1, duration: 0.8 },
  ],
  beats: 2,
  stepBeats: 1,
};
test('piano uses decoded recordings, reuses cache and stops every scheduled voice', async (t) => {
  const s = await setup(t);
  let level = 0;
  await s.engine.play(
    score,
    90,
    'soft',
    0.65,
    false,
    (_, l) => (level = l),
    () => {},
  );
  assert.equal(s.sources.length, 2);
  assert.equal(s.oscillators.length, 0);
  assert.equal(s.fetches, 17);
  assert.ok(level > 0);
  assert.ok(s.sources.every((v) => v.buffer && v.starts.length === 1));
  s.engine.stop();
  assert.ok(s.sources.every((v) => v.stops.length === 2));
  await s.engine.play(
    score,
    90,
    'soft',
    0.65,
    false,
    () => {},
    () => {},
  );
  assert.equal(s.fetches, 17);
  s.engine.dispose();
});
test('stopping during download never starts delayed notes', async (t) => {
  const pending = [];
  const s = await setup(t, () => new Promise((resolve) => pending.push(resolve)));
  const play = s.engine.play(
    score,
    90,
    'soft',
    0.65,
    false,
    () => {},
    () => {},
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(pending.length, 17);
  s.engine.stop();
  pending.forEach((resolve) => resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
  await play;
  assert.equal(s.sources.length, 0);
  s.engine.dispose();
});
test('missing sample fails explicitly and can be retried', async (t) => {
  let fail = true;
  const s = await setup(t, () => ({ ok: !fail, arrayBuffer: async () => new ArrayBuffer(8) }));
  await assert.rejects(
    s.engine.play(
      score,
      90,
      'soft',
      0.65,
      false,
      () => {},
      () => {},
    ),
  );
  assert.equal(s.sources.length, 0);
  fail = false;
  await s.engine.play(
    score,
    90,
    'soft',
    0.65,
    false,
    () => {},
    () => {},
  );
  assert.equal(s.sources.length, 2);
  s.engine.dispose();
});
test('natural completion credits listening exactly once after the full score', async (t) => {
  const s = await setup(t);
  let completed = 0;
  await s.engine.play(
    score,
    120,
    'soft',
    0.65,
    false,
    () => {},
    () => completed++,
  );
  s.advance(0.7);
  assert.equal(completed, 0);
  s.advance(2);
  assert.equal(completed, 1);
  s.advance(3);
  assert.equal(completed, 1);
  s.engine.dispose();
});
test('stopping or replacing a variant never credits an unfinished listen', async (t) => {
  const s = await setup(t);
  let first = 0;
  let second = 0;
  await s.engine.play(
    score,
    120,
    'soft',
    0.65,
    false,
    () => {},
    () => first++,
  );
  s.advance(0.4);
  s.engine.stop();
  s.advance(2);
  assert.equal(first, 0);
  await s.engine.play(
    score,
    120,
    'soft',
    0.65,
    false,
    () => {},
    () => first++,
  );
  await s.engine.play(
    score,
    120,
    'soft',
    0.65,
    false,
    () => {},
    () => second++,
  );
  s.advance(4);
  assert.equal(first, 0);
  assert.equal(second, 1);
  s.engine.dispose();
});
test('completion callbacks can chain A B C with no skipped or repeated credits', async (t) => {
  const s = await setup(t);
  const heard = [];
  const play = (i) =>
    s.engine.play(
      score,
      120,
      'soft',
      0.65,
      false,
      () => {},
      () => {
        heard.push(i);
        if (i < 2) void play(i + 1);
      },
    );
  await play(0);
  for (let i = 0; i < 3; i++) {
    s.advance((i + 1) * 2);
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(
      heard,
      Array.from({ length: i + 1 }, (_, j) => j),
    );
  }
  assert.equal(s.sources.length, 6);
  s.engine.dispose();
});
