import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  studyLessons,
  checkStudyAnswer,
  answerScore,
  noteLabel,
} from '../src/music/studyContent.ts';
import { domains } from '../src/music/curriculum.ts';
const questions = studyLessons.flatMap((l) => l.questions);
const byId = (id) => questions.find((q) => q.id === id);
test('eight eighth-note cells occupy four quarter-note beats', () => {
  for (const id of ['grid-offbeat', 'grid-downbeat']) {
    const q = byId(id);
    const s = answerScore(q, q.answer);
    assert.equal(s.beats, 4);
    assert.equal(s.stepBeats, 0.5);
    assert.deepEqual(
      s.events.map((e) => e.beat),
      [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
    );
  }
});
test('sixty-eight sourced lessons have 204 unique tasks in valid atlas topics', () => {
  assert.equal(studyLessons.length, 68);
  assert.equal(questions.length, 204);
  assert.equal(new Set(questions.map((q) => q.id)).size, 204);
  for (const l of studyLessons) {
    const domain = domains.find((d) => d.id === l.domain);
    assert.ok(domain);
    assert.ok(domain.topics[l.topic]);
    assert.equal(l.questions.length, 3);
    assert.equal(l.theory.length, 2);
    assert.ok(l.source.length);
    for (const s of l.source) assert.equal(new URL(s.url).protocol, 'https:');
  }
});
test('constructed chords sound simultaneously, with their fixed context', () => {
  for (const id of [
    'triad-minor-build',
    'seventh-c7',
    'seventh-minor',
    'applied-build',
    'mixture-iv',
  ]) {
    const q = byId(id);
    const score = answerScore(q, q.answer);
    assert.ok(score.events.every((e) => e.beat === 0));
    assert.deepEqual(
      score.events.map((e) => e.midi),
      [...(q.answerPrefix ?? []), ...q.answer],
    );
  }
  assert.deepEqual(
    answerScore(byId('mixture-iv'), [68])
      .events.map((e) => e.midi)
      .sort((a, b) => a - b),
    [65, 68, 72],
  );
});
test('aural recognition hides the source notation, while alternatives are independently audible', () => {
  for (const id of [
    'ear-minor-third',
    'ear-perfect-fifth',
    'ear-semitone',
    'ear-chord-minor',
    'ear-chord-augmented',
    'ear-chord-seven',
    'memory-preserve',
    'memory-end',
    'memory-start',
  ]) {
    const q = byId(id);
    assert.equal(q.hideGiven, true);
    assert.ok(q.given.events.length);
  }
  for (const id of ['memory-preserve', 'memory-end', 'memory-start']) {
    const q = byId(id);
    assert.deepEqual(q.options[q.answer[0]].score, q.given);
    assert.equal(
      q.options.filter((o) => JSON.stringify(o.score) === JSON.stringify(q.given)).length,
      1,
    );
  }
});
test('augmentation and diminution scale every onset and duration, preserving pitches', () => {
  for (const [id, ratio] of [
    ['rhythm-augment', 2],
    ['rhythm-diminish', 0.5],
  ]) {
    const q = byId(id);
    const a = q.given;
    const b = q.options[q.answer[0]].score;
    assert.equal(b.beats, a.beats * ratio);
    for (let i = 0; i < a.events.length; i++) {
      assert.equal(b.events[i].midi, a.events[i].midi);
      assert.equal(b.events[i].beat, a.events[i].beat * ratio);
      assert.equal(b.events[i].duration, a.events[i].duration * ratio);
    }
  }
});
test('modern collections and ordered row fragments match independent calculations', () => {
  assert.deepEqual(
    byId('collection-whole').answer,
    Array.from({ length: 6 }, (_, i) => 2 * i),
  );
  assert.deepEqual(byId('collection-octa').answer, [0, 1, 3, 4, 6, 7, 9, 10]);
  assert.deepEqual(
    byId('row-retrograde').answer,
    [0, 1, 4, 2].reverse().map((n) => 60 + n),
  );
  assert.deepEqual(
    byId('imitation-fifth').answer,
    [60, 62, 64].map((n) => n + 7),
  );
  assert.deepEqual(
    byId('motive-mirror').answer,
    [67, 69, 70].map((n) => 134 - n),
  );
});
test('server rules match every visible question exactly', () => {
  const rules = JSON.parse(
    readFileSync(new URL('../../src/main/resources/study-checks.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(
    rules,
    questions.map((q) => ({
      id: q.id,
      kind: q.kind,
      answer: q.answer,
      explanation: q.explanation,
      hint: q.hint,
      choices: q.options?.length ?? 0,
      length: q.length ?? 0,
    })),
  );
});
test('exact and diatonic transpositions are distinct; lydian changes only IV', () => {
  assert.deepEqual(
    byId('sequence-exact').answer,
    [60, 64, 67].map((n) => n + 2),
  );
  assert.deepEqual(byId('sequence-diatonic').answer, [62, 65]);
  assert.deepEqual(
    answerScore(byId('mode-lydian'), [66]).events.map((e) => e.midi),
    [60, 62, 64, 66, 67, 69, 71, 72],
  );
});
for (const q of questions)
  test(`${q.id}: accepts its rule, rejects blank and incorrect answers`, () => {
    assert.equal(checkStudyAnswer(q, [...q.answer]).ok, true);
    assert.equal(checkStudyAnswer(q, []).ok, false);
    if (q.kind === 'choice') {
      assert.ok(q.options[q.answer[0]]);
      for (let i = 0; i < q.options.length; i++)
        assert.equal(checkStudyAnswer(q, [i]).ok, i === q.answer[0]);
    } else {
      assert.equal(checkStudyAnswer(q, [...q.answer, 99]).ok, false);
      assert.equal(
        checkStudyAnswer(
          q,
          q.answer.map((n, i) => (i === 0 ? n + 1 : n)),
        ).ok,
        false,
      );
    }
  });
test('interval construction is independently checked in semitones', () => {
  assert.equal(byId('interval-build').answer[0] - 60, 8);
  assert.equal(byId('consonance-third').answer[0] - 62, 4);
  assert.equal(byId('function-resolve').answer[0] - 71, 1);
  assert.equal(byId('ornament-fill').answer[0], 62);
  assert.equal(noteLabel(68), 'Ля♭4');
  assert.equal(noteLabel(72), 'До5');
});
test('repair uses contrary stepwise motion and a consonant third', () => {
  const repaired = byId('motion-repair').answer[0];
  assert.equal(repaired - 67, -2);
  assert.equal(repaired - 62, 3);
  const score = answerScore(byId('motion-repair'), [repaired]);
  assert.deepEqual(
    score.events.map((e) => e.midi),
    [60, 67, 62, 65],
  );
  assert.equal(score.beats, 4);
});
test('pitch-class transformations follow mod12 and are order-independent but not multisets', () => {
  const mod = (n) => ((n % 12) + 12) % 12;
  assert.deepEqual(
    [...byId('pc-transpose').answer].sort((a, b) => a - b),
    [0, 3, 7].map((n) => mod(n + 2)).sort((a, b) => a - b),
  );
  assert.deepEqual(
    [...byId('pc-invert').answer].sort((a, b) => a - b),
    [0, 2, 7].map((n) => mod(-n)).sort((a, b) => a - b),
  );
  assert.equal(checkStudyAnswer(byId('pc-transpose'), [9, 2, 5]).ok, true);
  assert.equal(checkStudyAnswer(byId('pc-transpose'), [2, 5, 9, 9]).ok, false);
});
test('accent editing changes velocity, never the six pitches or pulse durations', () => {
  const q = byId('meter-two');
  const a = answerScore(q, []);
  const b = answerScore(q, q.answer);
  assert.equal(b.beats, 6);
  assert.deepEqual(
    a.events.map(({ gain, ...e }) => e),
    b.events.map(({ gain, ...e }) => e),
  );
  assert.deepEqual(
    b.events.flatMap((e, i) => (e.gain === 1 ? [i] : [])),
    [0, 2, 4],
  );
});
test('all provided and constructed scores use bounded piano pitches and finite timing', () => {
  for (const q of questions) {
    const scores = [
      q.given,
      ...(q.options ?? []).map((o) => o.score),
      answerScore(q, q.answer),
    ].filter(Boolean);
    for (const s of scores) {
      assert.ok(s.beats > 0);
      for (const e of s.events) {
        assert.ok(e.midi >= 36 && e.midi <= 84);
        assert.ok(Number.isFinite(e.beat) && e.beat >= 0);
        assert.ok(e.duration > 0);
        assert.ok(e.beat + e.duration <= s.beats);
      }
    }
  }
});
