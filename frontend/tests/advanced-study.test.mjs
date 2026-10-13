import test from 'node:test';
import assert from 'node:assert/strict';
import { advancedStudyLessons } from '../src/music/advancedStudyLessons.ts';
import { studyLessons, answerScore, checkStudyAnswer } from '../src/music/studyContent.ts';
const tasks = advancedStudyLessons.flatMap((l) => l.questions);
const q = (id) => tasks.find((t) => t.id === id);
const mod = (n) => ((n % 12) + 12) % 12;
test('new expansion adds exactly 32 modules, 96 tasks and reaches 60 atlas topics', () => {
  assert.equal(advancedStudyLessons.length, 32);
  assert.equal(tasks.length, 96);
  assert.equal(new Set(studyLessons.map((l) => `${l.domain}:${l.topic}`)).size, 60);
  assert.equal(new Set(advancedStudyLessons.map((l) => l.id)).size, 32);
});
test('every new editable pitch slot rejects an independent one-semitone error', () => {
  for (const t of tasks.filter((t) => t.kind === 'notes'))
    for (let i = 0; i < t.answer.length; i++) {
      const wrong = [...t.answer];
      wrong[i] += wrong[i] === 72 ? -1 : 1;
      assert.equal(checkStudyAnswer(t, wrong).ok, false, `${t.id} slot ${i}`);
    }
});
test('dictations use hidden audio with an explicit anchor and exact pitch order', () => {
  for (const id of ['dictation-arch', 'dictation-climb', 'dictation-leap']) {
    const t = q(id);
    assert.equal(t.hideGiven, true);
    assert.equal(t.given.events[0].midi, 60);
    assert.deepEqual(
      t.answer,
      t.given.events.map((e) => e.midi),
    );
  }
  for (const id of ['two-ear-up', 'two-ear-down', 'two-ear-return']) {
    const t = q(id);
    assert.equal(t.hideGiven, true);
    assert.deepEqual(
      t.given.events.filter((e, i) => i % 2 === 0).map((e) => e.midi),
      [48, 48, 48],
    );
    assert.deepEqual(
      t.answer,
      t.given.events.filter((e, i) => i % 2 === 1).map((e) => e.midi),
    );
    assert.deepEqual(answerScore(t, t.answer), t.given);
  }
});
test('posttonal hidden examples have the claimed steps and edge repetition', () => {
  for (const [id, delta] of [
    ['postear-chromatic', 1],
    ['postear-whole', 2],
  ]) {
    const t = q(id);
    assert.equal(t.hideGiven, true);
    const p = t.given.events.map((e) => e.midi);
    assert.deepEqual(
      p.slice(1).map((n, i) => n - p[i]),
      [delta, delta],
    );
  }
  const p = q('postear-repeat').given.events.map((e) => e.midi);
  assert.equal(p[0], p[2]);
  assert.equal(p[1] - p[0], 6);
});
test('additive accent positions are cumulative group lengths, in eighth units', () => {
  for (const [id, groups] of [
    ['additive-223', [2, 2, 3]],
    ['additive-322', [3, 2, 2]],
    ['additive-332', [3, 3, 2]],
  ]) {
    const t = q(id);
    const expected = groups.map((_, i) => groups.slice(0, i).reduce((a, b) => a + b, 0));
    assert.deepEqual(t.answer, expected);
    assert.equal(
      t.length,
      groups.reduce((a, b) => a + b, 0),
    );
    const s = answerScore(t, t.answer);
    assert.equal(s.beats, t.length / 2);
    assert.deepEqual(
      s.events.flatMap((e, i) => (e.gain === 1 ? [i] : [])),
      expected,
    );
  }
});
test('audible 3 against 2 has independently uniform attack layers', () => {
  const t = q('polycycle-32');
  const s = t.options[t.answer[0]].score;
  assert.deepEqual(
    s.events.filter((e) => e.midi === 48).map((e) => e.beat),
    [0, 3],
  );
  assert.deepEqual(
    s.events.filter((e) => e.midi === 72).map((e) => e.beat),
    [0, 2, 4],
  );
  assert.equal(s.beats, 6);
});
test('rhythmic alternatives have independently checked attack positions', () => {
  assert.deepEqual(
    q('rhythmlisten-even').options[q('rhythmlisten-even').answer[0]].score.events.map(
      (e) => e.beat,
    ),
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    q('rhythmlisten-gap').options[q('rhythmlisten-gap').answer[0]].score.events.map((e) => e.beat),
    [0, 1, 3],
  );
  const t = q('rhythmlisten-match');
  assert.deepEqual(t.options[t.answer[0]].score, t.given);
  assert.equal(
    t.options.filter((o) => JSON.stringify(o.score) === JSON.stringify(t.given)).length,
    1,
  );
});
test('directed V7 motions and chromatic chord construction match interval arithmetic', () => {
  assert.equal(q('v7-leading-upper').answer[0] - 71, 1);
  assert.equal(q('v7-seventh-down').answer[0] - 65, -1);
  assert.deepEqual(
    q('chromatic-neapolitan').answer.map((n) => n - 61),
    [0, 4, 7],
  );
  const s = q('chromatic-sixth').given;
  assert.deepEqual(
    s.events.map((e) => e.midi),
    [56, 66, 55, 67],
  );
  assert.equal(55 - 56, -1);
  assert.equal(67 - 66, 1);
});
test('limited harmonization answers really contain the melody in exactly one allowed triad', () => {
  for (const id of ['harmonize-e', 'harmonize-f']) {
    const t = q(id);
    const pc = t.given.events[0].midi % 12;
    const matches = t.options.flatMap((o, i) =>
      o.score.events.some((e) => e.midi % 12 === pc) ? [i] : [],
    );
    assert.deepEqual(matches, t.answer);
  }
});
test('complements and common tones follow independent set operations', () => {
  for (const [id, input] of [
    ['complement-whole', [0, 2, 4, 6, 8, 10]],
    ['complement-diatonic', [0, 2, 4, 5, 7, 9, 11]],
  ]) {
    assert.deepEqual(
      q(id).answer,
      Array.from({ length: 12 }, (_, i) => i).filter((n) => !input.includes(n)),
    );
  }
  for (const [id, t] of [
    ['common-t5', 5],
    ['common-t4', 4],
  ]) {
    const original = [0, 4, 7];
    const shifted = original.map((n) => mod(n + t));
    assert.deepEqual(
      q(id).answer,
      original.filter((n) => shifted.includes(n)),
    );
  }
});
test('ordered row operations preserve mathematical order, not just a set', () => {
  assert.deepEqual(
    q('rowfragment-t1').answer,
    [0, 3, 4, 7].map((n) => 60 + mod(n + 1)),
  );
  const inv = [0, 2, 5, 9].map((n) => mod(-n));
  assert.deepEqual(
    q('rowfragment-i0').answer,
    inv.map((n) => 60 + n),
  );
  assert.deepEqual(
    q('rowfragment-ri').answer,
    [...inv].reverse().map((n) => 60 + n),
  );
});
test('figured bass solutions measure intervals from the actual bass', () => {
  assert.deepEqual(q('continuo-53').answer, [60, 64, 67]);
  assert.deepEqual(q('continuo-63').answer, [64, 67, 72]);
  for (const id of ['continuo-53', 'continuo-63'])
    assert.ok(answerScore(q(id), q(id).answer).events.every((e) => e.beat === 0));
});
test('one-line octave doubling has a constant twelve-semitone distance', () => {
  const t = q('texture-octaves');
  const s = t.options[t.answer[0]].score;
  for (let i = 0; i < s.events.length; i += 2)
    assert.equal(s.events[i + 1].midi - s.events[i].midi, 12);
});
test('transcription correction has exactly one audio-identical alternative', () => {
  const t = q('verify-pitch');
  assert.equal(t.hideGiven, true);
  assert.deepEqual(t.options[t.answer[0]].score, t.given);
  assert.equal(
    t.options.filter((o) => JSON.stringify(o.score) === JSON.stringify(t.given)).length,
    1,
  );
});
