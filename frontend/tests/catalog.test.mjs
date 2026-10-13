import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stylePeriods,
  composerGroups,
  filteredTasks,
  periodForEra,
  readyIds,
} from '../src/music/catalog.ts';
import { interactiveIds } from '../src/music/model.ts';
const task = (id, periodId, composerId, aspects = ['Ритм']) => ({
  id,
  title: id,
  era: periodId === 'classical' ? 'Классицизм → Романтизм' : periodId,
  composer: composerId,
  aspects,
  placement: { periodId, periodName: periodId, composerId, focus: 'Переменные акценты' },
});
test('periods are chronological and do not contain generic practice or comparisons', () => {
  const tasks = [
    task('basic', 'basic', 'forma'),
    task('s', 'modern', 'stravinsky'),
    task('b', 'baroque', 'bach'),
    task('research', 'research', 'forma'),
    task('c', 'classical', 'beethoven'),
  ];
  assert.deepEqual(
    stylePeriods(tasks).map((p) => p.id),
    ['baroque', 'classical', 'modern'],
  );
  assert.equal(periodForEra(tasks, 'Классицизм → Романтизм'), 'classical');
});
test('composers group by stable ID and filters preserve style metadata', () => {
  const tasks = [
    task('a', 'baroque', 'bach'),
    task('b', 'baroque', 'bach', ['Гармония']),
    task('c', 'classical', 'mozart'),
  ];
  assert.deepEqual(
    composerGroups(tasks).map((c) => [c.id, c.tasks.length]),
    [
      ['bach', 2],
      ['mozart', 1],
    ],
  );
  assert.deepEqual(
    filteredTasks(tasks, 'Гармония', 'АКЦЕНТЫ').map((t) => t.id),
    ['b'],
  );
  assert.deepEqual(filteredTasks(tasks, 'Тембр'), []);
});
test('catalog readiness matches real interactive editors', () =>
  assert.deepEqual(readyIds, interactiveIds));
