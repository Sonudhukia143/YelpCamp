import test from 'node:test';
import assert from 'node:assert/strict';
import { ForEachRoute } from '../middlewares/forEachRoute.mjs';

test('ForEachRoute awaits the wrapped handler', async () => {
  let called = false;
  const wrapped = ForEachRoute(async () => {
    called = true;
  });

  await wrapped({}, {}, () => {});

  assert.equal(called, true);
});

test('ForEachRoute forwards handler errors to next', async () => {
  const expected = new Error('handler failed');
  let received;
  const wrapped = ForEachRoute(async () => {
    throw expected;
  });

  await wrapped({}, {}, (error) => {
    received = error;
  });

  assert.equal(received, expected);
});
