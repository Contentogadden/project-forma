import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { styleExercises } from '../src/music/styleExercises.ts';
import { initialState, scoreFor, feedback, interactiveIds } from '../src/music/model.ts';
import { expandedCatalog } from '../src/music/expandedPractice.ts';
import { composerPaths } from '../src/music/composerPaths.ts';
test('every new composer task has three audible alternatives and only one accepted answer', () => {
  assert.equal(Object.keys(styleExercises).length, 102);
  for (const [id, exercise] of Object.entries(styleExercises)) {
    assert.ok(interactiveIds.includes(id));
    assert.equal(new Set(exercise.options.map((o) => JSON.stringify(o.score.events))).size, 3);
    const state = initialState(id);
    assert.equal(feedback(id, state).ok, false);
    state.registerChoice = exercise.answer;
    assert.equal(feedback(id, state).ok, false, 'listening is required');
    state.heard = [0, 1, 2];
    for (let choice = 0; choice < 3; choice++) {
      state.registerChoice = choice;
      assert.equal(feedback(id, state).ok, choice === exercise.answer, id);
      const score = scoreFor(id, state);
      assert.equal(score, exercise.options[choice].score);
      assert.ok(score.events.length > 0);
      for (const event of score.events) {
        assert.ok(event.midi >= 36 && event.midi <= 84);
        assert.ok(event.beat >= 0 && event.beat + event.duration <= score.beats);
      }
    }
  }
});
test('all composer tasks returned by the backend have a working interactive editor', () => {
  const catalog = [
    'AssignmentService.java',
    'ComposerPractice.java',
    'ListeningPractice.java',
    'TransformationPractice.java',
    'NewComposerPractice.java',
  ]
    .map((file) =>
      readFileSync(
        new URL(`../../src/main/java/ru/projectforma/learning/${file}`, import.meta.url),
        'utf8',
      ),
    )
    .join('\n');
  const ids = [...catalog.matchAll(/task\(\s*"([^"]+)"/g)]
    .map((match) => match[1])
    .concat(
      expandedCatalog.composers.flatMap((c) => [c.practice.id, c.listening.id]),
      composerPaths.map((p) => p.id),
    );
  assert.equal(ids.length, 295);
  assert.deepEqual(
    ids.filter((id) => id !== 'era-forensics').filter((id) => !interactiveIds.includes(id)),
    [],
  );
  assert.equal(interactiveIds.length, 294);
});
test('Bach choices really preserve the given bass and exchange voice intervals', () => {
  const bass = styleExercises['baroque-bass'];
  assert.deepEqual(
    bass.options[bass.answer].score.events.slice(0, 8).map((e) => e.midi),
    bass.reference.events.map((e) => e.midi),
  );
  const voices = styleExercises['bach-voices'];
  const moved = voices.options[voices.answer].score.events;
  assert.deepEqual(
    moved.slice(0, 8).map((e) => e.midi),
    voices.reference.events.slice(0, 8).map((e) => e.midi - 24),
  );
  assert.deepEqual(
    moved.slice(8).map((e) => e.midi),
    voices.reference.events.slice(8).map((e) => e.midi + 24),
  );
});
test('Chopin rubato changes only melody timing, not the bass pulse', () => {
  const exercise = styleExercises['chopin-rubato'];
  const answer = exercise.options[exercise.answer].score;
  assert.deepEqual(
    answer.events.slice(8).map((e) => e.beat),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  assert.notDeepEqual(
    answer.events.slice(0, 8).map((e) => e.beat),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  assert.deepEqual(
    answer.events.map((e) => e.midi),
    exercise.reference.events.map((e) => e.midi),
  );
});
test('Debussy planing preserves chord intervals and Webern model has actual silence', () => {
  const d = styleExercises['debussy-color'];
  const events = d.options[d.answer].score.events;
  for (let i = 0; i < 4; i++)
    assert.deepEqual(
      events.slice(i * 3, i * 3 + 3).map((e) => e.midi),
      [60, 64, 68].map((n) => n + i * 2),
    );
  const w = styleExercises['webern-space'];
  const notes = w.options[w.answer].score.events;
  assert.ok(notes.every((n, i) => !i || n.beat > notes[i - 1].beat + notes[i - 1].duration));
  assert.ok(notes.every((n, i) => (i % 2 ? n.midi >= 72 : n.midi < 60)));
});
