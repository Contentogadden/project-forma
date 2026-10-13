import test from 'node:test';
import assert from 'node:assert/strict';
import {
  expandedCatalog,
  expandedCompositionExercises,
  expandedListeningExercises,
  listeningModel,
} from '../src/music/expandedPractice.ts';
import { feedback, initialState, scoreFor, interactiveIds } from '../src/music/model.ts';
import { filteredComposers } from '../src/music/catalog.ts';

test('adds exactly ten distinct composers and twenty ready exercises per epoch', () => {
  assert.equal(expandedCatalog.schemaVersion, 1);
  assert.equal(expandedCatalog.composers.length, 40);
  assert.equal(new Set(expandedCatalog.composers.map((c) => c.id)).size, 40);
  for (const period of Object.keys(expandedCatalog.periods)) {
    const group = expandedCatalog.composers.filter((c) => c.periodId === period);
    assert.equal(group.length, 10, period);
    for (const c of group) {
      assert.ok(c.name && c.years && c.gesture);
      assert.ok(interactiveIds.includes(c.practice.id) && interactiveIds.includes(c.listening.id));
      assert.equal(c.practice.notes.length, 8);
      assert.ok(c.practice.notes.every((n) => Number.isInteger(n) && n >= 60 && n <= 72));
      assert.ok(c.practice.editable.length > 0 && c.practice.editable.length < 8);
      assert.equal(new Set(c.practice.editable).size, c.practice.editable.length);
      assert.ok(c.practice.editable.every((i) => i >= 0 && i < 8));
    }
  }
  assert.equal(
    new Set(expandedCatalog.composers.flatMap((c) => [c.practice.id, c.listening.id])).size,
    80,
  );
  assert.equal(
    new Set(expandedCatalog.composers.map((c) => JSON.stringify(c.practice.notes))).size,
    40,
  );
});

test('shared listening descriptions match the actual generated exercise', () => {
  expandedCatalog.composers.forEach((c, i) => {
    const { exercise, aspect } = listeningModel(c, i);
    assert.equal(c.listening.goal, exercise.goal, c.id);
    assert.equal(c.listening.hint, exercise.hint, c.id);
    assert.equal(c.listening.aspect, aspect, c.id);
  });
});
test('composer search is case-insensitive, tolerates ё/е and preserves distinct Bach IDs', () => {
  const groups = expandedCatalog.composers;
  assert.deepEqual(
    filteredComposers(groups, '  ШЕНБЕРГ ').map((c) => c.id),
    ['schoenberg'],
  );
  assert.deepEqual(
    filteredComposers(groups, 'Бах').map((c) => c.id),
    ['cpebach', 'jcbach'],
  );
  assert.equal(filteredComposers(groups, 'НетТакогоАвтора').length, 0);
  assert.equal(filteredComposers(groups, '').length, 40);
});

function meetsCondition(c, events) {
  const n = c.practice.notes;
  const h = n.slice(0, 4);
  const kind = c.listening.kind;
  const exact = (notes, times = notes.map((_, i) => i), duration = 0.6) =>
    events.length === notes.length &&
    events.every((e, i) => e.midi === notes[i] && e.beat === times[i] && e.duration === duration);
  switch (kind) {
    case 'pedal':
      return (
        events.length === 9 &&
        events.slice(0, 8).every((e, i) => e.midi === n[i] && e.beat === i) &&
        events[8].midi === n[0] - 12 &&
        events[8].beat === 0 &&
        events[8].duration === 7.8
      );
    case 'octave':
      return (
        events.length === 16 &&
        events.slice(0, 8).every((e, i) => e.midi === n[i] && e.beat === i) &&
        events.slice(8).every((e, i) => e.midi === n[i] - 12 && e.beat === i)
      );
    case 'imitation':
      return exact([...h, ...h.map((v) => v + 7)]);
    case 'inversion':
      return exact([...h, ...h.map((v) => 72 - v + h[0])]);
    case 'diminution':
      return exact(
        n,
        n.map((_, i) => i / 2),
        0.3,
      );
    case 'augmentation':
      return exact(h, [0, 2, 4, 6], 1.2);
    case 'accent': {
      const a = c.id === 'bartok' ? [0, 3, 5] : c.id === 'boccherini' ? [0, 3, 6] : [1, 5];
      return exact(n) && events.every((e, i) => e.gain === (a.includes(i) ? 1 : 0.3));
    }
    case 'return':
      return exact([...n.slice(0, 3), n[3], n[4], ...n.slice(0, 3)]);
    case 'chord':
      return exact(n);
    case 'syncopation':
      return exact(h, [0.5, 2.5, 4.5, 6.5], 0.4);
    case 'staccato':
      return exact(n, undefined, 0.2);
    case 'ostinato':
      return exact([...h, ...h]);
    default:
      throw new Error(kind);
  }
}
test('only one alternative meets each independently checked musical condition', () => {
  for (const c of expandedCatalog.composers) {
    const t = expandedListeningExercises[c.listening.id];
    assert.deepEqual(
      t.options.map((o) => meetsCondition(c, o.score.events)),
      [0, 1, 2].map((i) => i === t.answer),
      c.id,
    );
    for (const score of [t.reference, ...t.options.map((o) => o.score)]) {
      assert.equal(score.beats, 8);
      assert.ok(score.events.length);
      for (const e of score.events) {
        assert.ok(e.midi >= 36 && e.midi <= 84);
        assert.ok(e.duration > 0 && e.beat >= 0 && e.beat + e.duration <= 8);
      }
    }
  }
});
test('new note models reject every wrong slot, tampered fixed notes and wrong length', () => {
  for (const c of expandedCatalog.composers) {
    const id = c.practice.id;
    const t = expandedCompositionExercises[id];
    const s = initialState(id);
    assert.equal(feedback(id, s).ok, false, id);
    s.notes = [...c.practice.notes];
    assert.equal(feedback(id, s).ok, true, id);
    assert.deepEqual(
      scoreFor(id, s).events.map((e) => e.midi),
      c.practice.notes,
    );
    for (let i = 0; i < 8; i++) {
      const wrong = { ...s, notes: [...s.notes] };
      wrong.notes[i] = wrong.notes[i] === 60 ? 61 : 60;
      assert.equal(feedback(id, wrong).ok, false, `${id} slot ${i}`);
    }
    assert.equal(feedback(id, { ...s, notes: [...s.notes, 60] }).ok, false, id);
    const blank = initialState(id);
    assert.deepEqual(blank.notes, t.initial);
    assert.notEqual(blank.notes, t.initial);
  }
});
test('concrete modal, chromatic and interval models have their advertised pitches', () => {
  const notes = (id) => expandedCatalog.composers.find((c) => c.id === id).practice.notes;
  assert.deepEqual(
    notes('messiaen')
      .slice(1)
      .map((n, i) => n - notes('messiaen')[i]),
    [2, 1, 2, 1, 2, 1, 2],
  );
  assert.deepEqual(
    notes('shostakovich')
      .slice(0, 4)
      .map((n) => n % 12),
    [2, 3, 0, 11],
  );
  assert.ok(notes('bartok').includes(71));
  assert.equal(notes('bartok').includes(70), false);
  assert.deepEqual(
    notes('purcell')
      .slice(1, 4)
      .map((n, i) => n - notes('purcell')[i]),
    [-1, -1, -1],
  );
  assert.deepEqual(
    [notes('hindemith')[1] - notes('hindemith')[0], notes('hindemith')[2] - notes('hindemith')[1]],
    [5, 5],
  );
  assert.deepEqual(
    notes('smetana')
      .slice(4)
      .map((n, i) => n - notes('smetana')[i]),
    [2, 2, 2, 2],
  );
});
