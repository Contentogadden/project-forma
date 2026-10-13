import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyMemory, recordAnswer, adaptiveQuestion } from '../src/music/adaptive.ts';
import { makeQuestion } from '../src/music/drills.ts';
test('repeated mistakes slow practice and target a weak concept', () => {
  const q = makeQuestion('intervals', 0, () => 0);
  let m = recordAnswer(emptyMemory(), q, false);
  m = recordAnswer(m, q, false);
  const a = adaptiveQuestion('intervals', 1, m, () => 0);
  assert.equal(a.question.answer, q.answer);
  assert.equal(a.tempo, 60);
  assert.ok(a.focused);
  assert.equal(adaptiveQuestion('intervals', 2, m, () => 0).focused, false);
});
test('correct answers reduce weakness and memory is independent', () => {
  const q = makeQuestion('chords', 0, () => 0);
  const m = recordAnswer(emptyMemory(), q, false);
  assert.equal(recordAnswer(m, q, true).mistakes[q.answer], 0);
  assert.equal(emptyMemory().mistakes[q.answer], undefined);
});
