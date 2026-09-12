import test from 'node:test';
import assert from 'node:assert/strict';
import { User, forValidationUser } from '../models/user.mjs';

const validUser = {
  username: 'campuser',
  gmail: 'campuser@example.com',
  password: 'secret123'
};

test('user validation accepts valid input', () => {
  const { error, value } = forValidationUser(validUser);

  assert.equal(error, undefined);
  assert.equal(value.username, 'campuser');
  assert.equal(value.gmail, 'campuser@example.com');
});

test('user validation rejects missing required fields', () => {
  const { error } = forValidationUser({ username: 'campuser' });

  assert.ok(error);
  assert.match(error.message, /gmail|required/i);
});

test('user validation rejects an empty username', () => {
  const { error } = forValidationUser({
    ...validUser,
    username: ''
  });

  assert.ok(error);
  assert.match(error.message, /username|required/i);
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
