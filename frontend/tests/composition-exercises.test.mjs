import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compositionExercises } from '../src/music/compositionExercises.ts';
import { initialState, scoreFor, feedback, isMelody } from '../src/music/model.ts';
import { composers, portraitSource } from '../src/music/composers.ts';
import { expandedCatalog } from '../src/music/expandedPractice.ts';
import { composerPaths } from '../src/music/composerPaths.ts';
const answers = {
  ...Object.fromEntries(
    composerPaths
      .filter((p) => p.kind !== 'recognize')
      .map((p) => [p.id, p.editable.map((i) => p.notes[i])]),
  ),
  ...Object.fromEntries(
    expandedCatalog.composers.map((c) => [
      c.practice.id,
      c.practice.editable.map((i) => c.practice.notes[i]),
    ]),
  ),
  'vivaldi-down-sequence': [64, 62],
  'clementi-scale': [64, 67, 71],
  'liszt-augmented': [64, 68],
  'ravel-seventh': [64, 67, 71],
  'bach-step-sequence': [64, 65],
  'haydn-tonic-arch': [64, 67],
  'mozart-passing': [62, 65],
  'beethoven-fragment': [64, 67, 64, 67],
  'schubert-flat-line': [67, 68, 67],
  'chopin-double-neighbor': [65, 63],
  'brahms-rising-thirds': [68, 71],
  'debussy-five-step': [67, 69],
  'stravinsky-cell-groups': [60, 60, 66, 66],
  'webern-mirror-cell': [65, 61, 60],
  'bach-answer': [67, 69, 71, 72],
  'haydn-close': [65, 64, 62, 60],
  'mozart-turn': [65, 64, 62, 64],
  'beethoven-inversion': [70, 68],
  'schubert-minor': [63, 68, 63],
  'chopin-neighbor': [67, 66, 67],
  'brahms-thirds': [71, 68, 64],
  'debussy-whole-tone': [68, 70, 72],
  'stravinsky-ostinato': [60, 62, 65, 62],
  'webern-retrograde': [67, 66, 61, 60],
};
test('184 editable tasks reject blanks and accept correct musical transformations', () => {
  assert.equal(Object.keys(compositionExercises).length, 184);
  for (const [id, exercise] of Object.entries(compositionExercises)) {
    const state = initialState(id);
    assert.ok(isMelody(id));
    assert.equal(feedback(id, state).ok, false, id);
    exercise.editable.forEach((slot, i) => {
      state.notes[slot] = answers[id][i];
      assert.ok(exercise.keys.includes(answers[id][i]));
    });
    assert.equal(feedback(id, state).ok, true, id);
    const score = scoreFor(id, state);
    assert.equal(score.beats, 8);
    assert.deepEqual(
      score.events.map((e) => e.midi),
      state.notes.filter(Boolean),
    );
    const slot = exercise.editable[0];
    state.notes[slot] = state.notes[slot] === 60 ? 61 : 60;
    assert.equal(feedback(id, state).ok, false, `${id} rejects a wrong pitch`);
  }
});
test('each editable slot is checked independently and preserves the timing of fixed rests', () => {
  for (const [id, exercise] of Object.entries(compositionExercises)) {
    const solved = initialState(id);
    exercise.editable.forEach((slot, i) => (solved.notes[slot] = answers[id][i]));
    for (const slot of exercise.editable) {
      const wrong = { ...solved, notes: [...solved.notes] };
      wrong.notes[slot] = wrong.notes[slot] === 60 ? 61 : 60;
      assert.equal(feedback(id, wrong).ok, false, `${id}: place ${slot + 1}`);
      wrong.notes[slot] = 0;
      assert.equal(feedback(id, wrong).ok, false, `${id}: blank ${slot + 1}`);
    }
    const score = scoreFor(id, solved);
    assert.deepEqual(
      score.events.map((e) => e.beat),
      solved.notes.flatMap((n, i) => (n ? [i] : [])),
      id,
    );
  }
});
test('given notes stay fixed and each attempt has independent arrays', () => {
  for (const [id, exercise] of Object.entries(compositionExercises)) {
    const one = initialState(id);
    const two = initialState(id);
    exercise.editable.forEach((slot, i) => (one.notes[slot] = answers[id][i]));
    const given = exercise.initial.findIndex((_, i) => !exercise.editable.includes(i));
    one.notes[given] = one.notes[given] === 60 ? 62 : 60;
    assert.equal(feedback(id, one).ok, false, id);
    assert.deepEqual(two.notes, exercise.initial);
  }
});
test('all fifty-four composers have credited portraits or intentional symbolic cards', () => {
  assert.equal(Object.keys(composers).length, 54);
  for (const [id, composer] of Object.entries(composers)) {
    if (composer.source) {
      const bytes = readFileSync(new URL(`../public/composers/${id}.jpg`, import.meta.url));
      assert.equal(bytes[0], 255);
      assert.equal(bytes[1], 216);
      assert.ok(bytes.length > 10000);
      assert.match(portraitSource(id), /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    } else assert.equal(composer.credit, 'Типографическая карточка Forma');
    assert.ok(composer.credit);
  }
});
