import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCsrfToken, requestJson } from '../src/http.ts';

async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}

test('GET reads do not request a CSRF token', async () => {
  const calls = [];
  await withFetch(
    async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ ready: true }) };
    },
    async () => {
      assert.deepEqual(await requestJson('/api/test'), { ready: true });
      assert.equal(calls.length, 1);
      assert.equal(calls[0].options.body, undefined);
    },
  );
});

test('writes stop before submitting if CSRF retrieval fails', async () => {
  const calls = [];
  await withFetch(
    async (url) => {
      calls.push(url);
      return { ok: false };
    },
    async () => {
      await assert.rejects(requestJson('/api/test', 'POST', { answer: 1 }), /защитный токен/);
      assert.deepEqual(calls, ['/api/auth/csrf']);
      await assert.rejects(getCsrfToken(), /защитный токен/);
    },
  );
});

test('unreadable error bodies retain meaningful HTTP errors', async () => {
  for (const [status, message] of [
    [401, /Сессия/],
    [403, /прав/],
    [500, /выполнить запрос/],
  ]) {
    await withFetch(
      async () => ({
        ok: false,
        status,
        json: async () => {
          throw new Error();
        },
      }),
      async () => {
        await assert.rejects(requestJson('/api/test'), message);
      },
    );
  }
});
