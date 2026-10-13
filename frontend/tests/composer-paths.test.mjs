import test from 'node:test';
import assert from 'node:assert/strict';
import {
  composerPaths,
  pathCompositionExercises,
  pathListeningExercises,
} from '../src/music/composerPaths.ts';
import { initialState, feedback, scoreFor } from '../src/music/model.ts';
test('160 tasks give every expanded composer four additional formats', () => {
  assert.equal(composerPaths.length, 160);
  assert.equal(new Set(composerPaths.map((p) => p.id)).size, 160);
  for (const era of ['baroque', 'classical', 'romantic', 'modern'])
    assert.equal(composerPaths.filter((p) => p.periodId === era).length, 40);
  const groups = Map.groupBy(composerPaths, (p) => p.composerId);
  assert.equal(groups.size, 40);
  for (const group of groups.values())
    assert.deepEqual(
      group.map((p) => p.kind),
      ['dictation', 'transpose', 'retrograde', 'recognize'],
    );
});
test('independent musical oracle validates reversals, exact copies and two-semitone shifts', () => {
  for (const p of composerPaths) {
    assert.equal(p.notes.length, 8);
    assert.equal(p.reference.length, 8);
    assert.ok(
      p.notes.every((n) => n === 0 || (n >= 60 && n <= 72)),
      p.id,
    );
    if (p.kind === 'dictation' || p.kind === 'recognize') assert.deepEqual(p.notes, p.reference);
    if (p.kind === 'retrograde') assert.deepEqual(p.notes, [...p.reference].reverse());
    if (p.kind === 'transpose') {
      const shifts = p.notes.slice(0, 4).flatMap((n, i) => (n ? [p.notes[i + 4] - n] : []));
      assert.ok(shifts.every((n) => n === shifts[0]));
      assert.equal(Math.abs(shifts[0]), 2);
      assert.deepEqual(p.notes.slice(0, 4).map(Boolean), p.notes.slice(4).map(Boolean));
    }
  }
});
test('all new editors check each slot and expose localized feedback without spoiling dictation', () => {
  for (const p of composerPaths.filter((p) => p.kind !== 'recognize')) {
    const task = pathCompositionExercises[p.id];
    const state = initialState(p.id);
    assert.equal(feedback(p.id, state).ok, false);
    state.notes = [...p.notes];
    assert.equal(feedback(p.id, state).ok, true);
    assert.equal(task.hideReference, p.kind === 'dictation');
    assert.deepEqual(
      scoreFor(p.id, state, true).events.map((e) => e.midi),
      p.reference.filter(Boolean),
    );
    for (const slot of p.editable) {
      let bad = { ...state, notes: [...state.notes] };
      bad.notes[slot] = bad.notes[slot] === 72 ? 71 : bad.notes[slot] + 1;
      assert.equal(feedback(p.id, bad).ok, false);
      assert.match(feedback(p.id, bad).text, new RegExp(`место ${slot + 1}`));
    }
  }
});
test('recognition alternatives have identical timing and exactly one unchanged pitch sequence', () => {
  for (const p of composerPaths.filter((p) => p.kind === 'recognize')) {
    const task = pathListeningExercises[p.id];
    let matches = 0;
    task.options.forEach((o, i) => {
      assert.deepEqual(
        o.score.events.map((e) => [e.beat, e.duration]),
        task.reference.events.map((e) => [e.beat, e.duration]),
      );
      const differences = o.score.events.filter(
        (e, j) => e.midi !== task.reference.events[j].midi,
      ).length;
      assert.equal(differences, i === task.answer ? 0 : 1);
      if (!differences) matches++;
      const state = initialState(p.id);
      state.registerChoice = i;
      state.heard = [0, 1, 2];
      assert.equal(feedback(p.id, state).ok, i === task.answer);
    });
    assert.equal(matches, 1);
  }
});
