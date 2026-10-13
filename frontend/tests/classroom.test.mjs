import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preset, motivePreset, condition, api, countWord } from '../src/classroom/api.ts';

test('Russian counts keep singular, plural and teen endings', () => {
  const expected = ['many', 'one', 'few', 'few', 'few', 'many'];
  for (let count = 0; count < expected.length; count++) {
    assert.equal(countWord(count, 'one', 'few', 'many'), expected[count]);
  }
  for (const count of [11, 12, 13, 14, 111, 112, 113, 114]) {
    assert.equal(countWord(count, 'one', 'few', 'many'), 'many');
  }
  assert.equal(countWord(21, 'one', 'few', 'many'), 'one');
  assert.equal(countWord(22, 'one', 'few', 'many'), 'few');
});

test('new templates have independent musical arrays', () => {
  const a = preset();
  const b = preset();
  a.initial[0] = 72;
  a.editable.push(0);
  assert.equal(b.initial[0], 60);
  assert.deepEqual(b.editable, [6, 7]);
  assert.deepEqual(b.reference, [60, 62, 64, 67, 64, 62, 64, 62]);
});
test('feedback checks only editable gaps and distinguishes formal checks from assessment', () => {
  const d = preset();
  assert.match(condition(d, d.initial), /Заполните/);
  assert.match(condition(d, [60, 62, 64, 67, 64, 62, 62, 62]), /последнюю/);
  assert.match(condition(d, [60, 62, 64, 67, 64, 62, 62, 60]), /оценит преподаватель/);
  d.initial[0] = 0;
  d.lastNote = 0;
  assert.match(condition(d, [0, 62, 64, 67, 64, 62, 62, 62]), /выполнены/);
});
test('copied motive keeps fixed quarter rests and three editable response pitches', () => {
  const d = motivePreset();
  assert.deepEqual(d.editable, [4, 5, 6]);
  assert.equal(d.initial[3], 0);
  assert.equal(d.initial[7], 0);
  assert.deepEqual(d.reference, [60, 62, 64, 0, 60, 62, 64, 0]);
  assert.ok(d.allowed.includes(66));
  assert.match(condition(d, [60, 62, 64, 0, 62, 64, 66, 0]), /выполнены/);
});
test('classroom writes use CSRF and surface server errors', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return url === '/api/auth/csrf'
      ? { ok: true, json: async () => ({ headerName: 'X-CSRF-TOKEN', token: 'test-mask' }) }
      : { ok: false, status: 409, json: async () => ({ message: 'Конфликт версий' }) };
  };
  try {
    await assert.rejects(
      api('/works/1/answer', 'PUT', { version: 2, notes: preset().initial, submit: false }),
      /Конфликт версий/,
    );
    assert.equal(calls[1].options.headers['X-CSRF-TOKEN'], 'test-mask');
    assert.equal(JSON.parse(calls[1].options.body).submit, false);
  } finally {
    globalThis.fetch = original;
  }
});
