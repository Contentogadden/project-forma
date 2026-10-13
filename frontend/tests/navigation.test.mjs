import { test } from 'node:test';
import assert from 'node:assert/strict';
import { practiceDoors } from '../src/practiceNavigation.ts';
import { interactiveIds } from '../src/music/model.ts';
test('each of the five visual navigation cards opens a distinct implemented exercise', () => {
  assert.equal(practiceDoors.length, 5);
  assert.equal(new Set(practiceDoors.map((d) => d.task)).size, 5);
  assert.equal(new Set(practiceDoors.map((d) => d.image)).size, 5);
  for (const d of practiceDoors) assert.ok(interactiveIds.includes(d.task));
});
