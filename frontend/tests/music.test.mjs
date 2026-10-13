import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, scoreFor, feedback, compareScores, givenBass } from '../src/music/model.ts';
import { pianoSamples, sampleFor } from '../src/music/pianoSamples.ts';
import { readFileSync } from 'node:fs';

test('an explicit form block wins over the full reference and each state has independent notes', () => {
  const state = initialState('form-return');
  const block = scoreFor('form-return', state, true, 1, 'B');
  assert.equal(block.beats, 8);
  assert.equal(block.events[0].midi, 67);
  assert.equal(scoreFor('form-return', state, true).beats, 24);
  const first = initialState('melody-question');
  const second = initialState('melody-question');
  first.notes[0] = 72;
  assert.equal(second.notes[0], 60);
});

test('motive transfer preserves intervals, not just contour', () => {
  const s = initialState('beethoven-motive');
  s.notes.splice(4, 3, 62, 64, 66);
  assert.equal(feedback('beethoven-motive', s).ok, true);
  s.notes[6] = 65;
  assert.equal(feedback('beethoven-motive', s).ok, false);
});
test('changing accents does not change pitch or pulse', () => {
  const s = initialState();
  s.hits = s.hits.map((_, i) => ([0, 3, 6, 8, 10, 13].includes(i) ? 2 : 1));
  assert.equal(feedback('stravinsky-accent', s).ok, true);
  assert.equal(new Set(scoreFor('stravinsky-accent', s).events.map((e) => e.midi)).size, 1);
});
test('duple groups cross four bars of triple metre', () => {
  const s = initialState();
  s.hits = s.hits.map((_, i) => (i % 2 === 0 ? 2 : 1));
  const score = scoreFor('brahms-meter', s);
  assert.equal(score.beats, 12);
  assert.equal(score.events.length, 12);
  assert.equal(feedback('brahms-meter', s).ok, true);
});

test('empty notes are silent, but keep their place in musical time', () => {
  const s = initialState();
  s.notes[6] = 0;
  s.notes[7] = 60;
  const score = scoreFor('melody-question', s);
  assert.equal(score.events.length, 7);
  assert.equal(score.events.at(-1).beat, 7);
  assert.equal(score.beats, 8);
});
test('changing a chord changes the actual simultaneous notes', () => {
  const s = initialState();
  s.chords[3] = 'C';
  assert.deepEqual(
    scoreFor('harmony-home', s)
      .events.filter((e) => e.beat === 12)
      .map((e) => e.midi),
    [48, 55, 60, 64],
  );
});
test('harmonisation preserves the given bass even under an incorrect chord', () => {
  const s = initialState();
  s.chords = ['G', 'G', 'F', 'F'];
  const score = scoreFor('harmony-home', s);
  assert.deepEqual(
    [0, 4, 8, 12].map((beat) => score.events.find((e) => e.beat === beat).midi),
    givenBass,
  );
  assert.equal(feedback('harmony-home', s).ok, false);
  s.chords = ['C', 'F', 'G', 'C'];
  assert.equal(feedback('harmony-home', s).ok, true);
});
test('comparison has two silent beats and preserves answer timing', () => {
  const s = initialState();
  const reference = scoreFor('melody-question', s, true);
  const answer = scoreFor('melody-question', s);
  const score = compareScores(reference, answer);
  assert.equal(score.beats, 18);
  assert.equal(score.events[reference.events.length].beat, 10);
  assert.deepEqual(
    answer.events.map((e) => e.midi),
    score.events.slice(reference.events.length).map((e) => e.midi),
  );
});
test('all piano samples are bundled MPEG audio and pitches stay near recorded roots', () => {
  for (const sample of pianoSamples) {
    const file = readFileSync(new URL(`../public${sample.url}`, import.meta.url));
    assert.ok(file.length > 10000);
    assert.ok(file.subarray(0, 3).toString() === 'ID3' || file[0] === 255);
    assert.equal(sampleFor(sample.midi).rate, 1);
  }
  for (let midi = 36; midi <= 84; midi++) assert.ok(Math.abs(sampleFor(midi).midi - midi) <= 1);
});
test('offbeat accents retain the original timing and are louder', () => {
  const s = initialState();
  s.hits = s.hits.map((_, i) => (i % 4 === 3 ? 2 : 1));
  const score = scoreFor('rhythm-shift', s);
  assert.equal(score.events[3].beat, 1.5);
  assert.ok(score.events[3].gain > score.events[2].gain);
  assert.equal(feedback('rhythm-shift', s).ok, true);
  s.hits[0] = 0;
  assert.equal(feedback('rhythm-shift', s).ok, false);
});
test('form return preserves melody transposed by an octave', () => {
  const s = initialState();
  s.order = ['A', 'B', 'A′'];
  const events = scoreFor('form-return', s).events;
  assert.deepEqual(
    events.slice(16).map((n) => n.midi),
    events.slice(0, 8).map((n) => n.midi + 12),
  );
  assert.equal(feedback('form-return', s).ok, true);
});
test('timbre task needs all three listens and a choice, without grading taste', () => {
  const s = initialState();
  s.heard = [0, 1, 2];
  assert.equal(feedback('timbre-register', s).ok, false);
  for (const choice of [0, 1, 2]) {
    s.registerChoice = choice;
    assert.equal(feedback('timbre-register', s).ok, true);
  }
  const low = scoreFor('timbre-register', s, false, 0);
  const high = scoreFor('timbre-register', s, false, 2);
  assert.deepEqual(
    high.events.map((n) => n.midi),
    low.events.map((n) => n.midi + 24),
  );
});
