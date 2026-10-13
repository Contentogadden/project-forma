import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion } from '../src/music/drills.ts';
test('all generated questions contain the correct answer and valid piano pitches', () => {
  for (const kind of ['notes', 'intervals', 'chords'])
    for (let i = 0; i < 100; i++) {
      const q = makeQuestion(kind, i);
      assert.ok(q.choices.includes(q.answer));
      assert.ok(q.pitches.every((n) => n >= 60 && n <= 76));
      assert.equal(new Set(q.choices).size, q.choices.length);
    }
});
test('interval and chord construction match named answers', () => {
  assert.deepEqual(makeQuestion('intervals', 0, () => 0).pitches, [60, 62]);
  assert.equal(makeQuestion('intervals', 0, () => 0).answer, 'Большая секунда');
  assert.deepEqual(makeQuestion('chords', 0, () => 0).pitches, [60, 64, 67]);
  assert.equal(makeQuestion('chords', 0, () => 0.9).answer, 'Минорное');
});
test('memory changes exactly one note in the second phrase', () => {
  for (let i = 0; i < 100; i++) {
    const q = makeQuestion('memory', i);
    const changed = q.pitches
      .slice(0, 4)
      .map((n, j) => (n !== q.pitches[j + 4] ? j + 1 : 0))
      .filter(Boolean);
    assert.deepEqual(changed, [Number(q.answer)]);
    assert.equal(q.pitches.length, 8);
  }
});
