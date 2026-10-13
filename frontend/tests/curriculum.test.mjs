import test from 'node:test';
import assert from 'node:assert/strict';
import {
  domains,
  knowledgeGroups,
  topicCount,
  taskPlacements,
  atlasFamilies,
  neutralAssignment,
} from '../src/music/curriculum.ts';
import { interactiveIds } from '../src/music/model.ts';
const tasks = interactiveIds.map((id) => ({
  id,
  title: id,
  composer: 'Historical author',
  era: 'Old era',
  aspects: [],
  placement: { periodId: 'old', periodName: 'Old era', composerId: 'author', focus: 'old' },
}));
test('atlas has fourteen distinct domains and complete topic navigation', () => {
  assert.equal(domains.length, 14);
  assert.equal(new Set(domains.map((d) => d.id)).size, 14);
  assert.equal(topicCount, 120);
  for (const d of domains) {
    assert.ok(knowledgeGroups.some((g) => g.id === d.group));
    for (const id of d.related) {
      assert.ok(domains.some((x) => x.id === id));
      assert.notEqual(id, d.id);
    }
  }
});
test('every interactive model has a valid educational placement', () => {
  for (const id of interactiveIds) {
    const p = taskPlacements[id];
    assert.ok(p, id);
    const d = domains.find((d) => d.id === p.domain);
    assert.ok(d, id);
    assert.ok(p.topic >= 0 && p.topic < d.topics.length, id);
  }
});
test('families conserve all IDs without repetitive catalog cards', () => {
  const families = atlasFamilies(tasks);
  const ids = families.flatMap((f) => f.tasks.map((t) => t.id));
  assert.equal(ids.length, interactiveIds.length);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(families.length < tasks.length / 2);
  assert.equal(atlasFamilies(tasks, 'ear', 1, '', 'dictation').length, 1);
  assert.equal(atlasFamilies(tasks, 'ear', 1, '', 'dictation')[0].tasks.length, 40);
});
test('topic and format filters do not admit unrelated tasks', () => {
  for (const f of atlasFamilies(tasks, 'polyphony', 7)) {
    for (const t of f.tasks) {
      assert.equal(taskPlacements[t.id].domain, 'polyphony');
      assert.equal(taskPlacements[t.id].topic, 7);
    }
  }
  assert.equal(atlasFamilies(tasks, 'ear', 1, '', 'listen').length, 0);
  assert.ok(atlasFamilies(tasks, 'harmony', undefined, 'КАДЕНЦИИ').length > 0);
});
test('unimplemented academic domains remain honest curriculum gaps', () => {
  for (const id of ['history', 'analysis', 'theories', 'research', 'teaching', 'digital'])
    assert.equal(atlasFamilies(tasks, id).length, 0, id);
});
test('neutral framing preserves task identity and never mutates saved source metadata', () => {
  const original = tasks[0];
  const copy = neutralAssignment(original);
  assert.equal(copy.id, original.id);
  assert.equal(copy.composer, 'Учебная модель Forma');
  assert.equal(original.composer, 'Historical author');
  assert.notEqual(copy.placement, original.placement);
  assert.equal(copy.placement.composerId, original.placement.composerId);
});
