import test from 'node:test';
import assert from 'node:assert/strict';
import { User, forValidationUser } from '../models/user.mjs';

const validUser = {
  username: 'campuser',
  gmail: 'campuser@example.com',
  password: 'secret123'
};

test('user validation currently exposes the Joi dependency bug', () => {
  assert.throws(
    () => forValidationUser(validUser),
    ReferenceError
  );
});

test('user schema requires gmail', () => {
  const user = new User({ username: 'campuser' });
  const error = user.validateSync();

  assert.ok(error);
  assert.ok(error.errors.gmail);
});

test('user schema accepts a gmail value', () => {
  const user = new User({
    username: 'campuser',
    gmail: 'campuser@example.com'
  });

  const error = user.validateSync();

  assert.equal(error, undefined);
  assert.equal(user.gmail, 'campuser@example.com');
});
