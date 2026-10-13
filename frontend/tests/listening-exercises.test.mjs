import test from 'node:test';
import assert from 'node:assert/strict';
import { listeningExercises as tasks } from '../src/music/listeningExercises.ts';
const answer = (id) => tasks[id].options[tasks[id].answer].score.events;
test('ten listening models have bounded scores and distinct alternatives', () => {
  assert.equal(Object.keys(tasks).length, 14);
  for (const [id, t] of Object.entries(tasks)) {
    assert.equal(new Set(t.options.map((o) => JSON.stringify(o.score.events))).size, 3, id);
    for (const score of [t.reference, ...t.options.map((o) => o.score)])
      for (const e of score.events) {
        assert.ok(e.midi >= 36 && e.midi <= 84, id);
        assert.ok(e.beat >= 0 && e.duration > 0 && e.beat + e.duration <= score.beats, id);
      }
  }
});
test('sequence, diminution and variation meet their exact conditions', () => {
  assert.deepEqual(
    answer('bach-sequence').map((e) => e.midi),
    [62, 64, 65],
  );
  answer('beethoven-compression').forEach((e, i) => {
    assert.equal(e.midi, tasks['beethoven-compression'].reference.events[i].midi);
    assert.equal(e.beat, i / 2);
    assert.equal(e.duration, 0.35);
  });
  assert.deepEqual(
    answer('brahms-variation').map((e) => e.midi),
    [67, 64, 60],
  );
  assert.deepEqual(
    answer('brahms-variation').map((e) => e.duration),
    [0.35, 0.35, 1.8],
  );
});
test('accents change gain only; Alberti bass preserves eight even beats', () => {
  const h = answer('haydn-surprise');
  assert.deepEqual(
    h.map((e) => e.gain),
    [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 1],
  );
  assert.deepEqual(
    h.map(({ gain, ...e }) => e),
    tasks['haydn-surprise'].reference.events.map(({ gain, ...e }) => e),
  );
  assert.deepEqual(
    answer('mozart-alberti').map((e) => e.midi),
    [48, 55, 52, 55, 48, 55, 52, 55],
  );
  assert.deepEqual(
    answer('mozart-alberti').map((e) => e.beat),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  assert.deepEqual(
    answer('stravinsky-displacement').flatMap((e, i) => (e.gain === 1 ? [i + 1] : [])),
    [2, 6],
  );
});
test('pedal and suspension are sustained events rather than repeated attacks', () => {
  const p = answer('schubert-pedal');
  assert.deepEqual(p.slice(0, 8), tasks['schubert-pedal'].reference.events);
  assert.equal(p[8].midi, 48);
  assert.equal(p[8].duration, 7.8);
  const s = answer('chopin-suspension').slice(-2);
  assert.deepEqual(
    s.map((e) => e.midi),
    [72, 71],
  );
  assert.deepEqual(
    s.map((e) => e.beat),
    [0, 6],
  );
  assert.ok(s[0].duration > 4 && s[0].duration < 6);
});
test('pentatonic set membership and octave expansion are unambiguous', () => {
  const t = tasks['debussy-pentatonic'];
  t.options.forEach((o, i) =>
    assert.equal(
      o.score.events.every((e) => [0, 2, 4, 7, 9].includes(e.midi % 12)),
      i === t.answer,
    ),
  );
  const w = tasks['webern-expansion'];
  answer('webern-expansion').forEach((e, i) => {
    assert.equal(e.midi % 12, w.reference.events[i].midi % 12);
    assert.equal(e.beat, w.reference.events[i].beat);
    assert.equal(e.duration, 0.35);
    assert.equal(e.midi - w.reference.events[i].midi, i % 2 ? 12 : 0);
  });
});
