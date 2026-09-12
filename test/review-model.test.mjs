import test from 'node:test';
import assert from 'node:assert/strict';
import { forValidationReview, Review } from '../models/review.mjs';

const validReview = {
  rating: 5,
  review: 'Excellent campsite.'
};

test('review validation accepts valid input', () => {
  const { error, value } = forValidationReview(validReview);

  assert.equal(error, undefined);
  assert.equal(value.rating, 5);
  assert.equal(value.review, 'Excellent campsite.');
});

test('review validation rejects missing rating', () => {
  const { error } = forValidationReview({ review: 'Good place.' });

  assert.ok(error);
  assert.match(error.message, /rating|required/i);
});

test('review validation rejects missing review text', () => {
  const { error } = forValidationReview({ rating: 4 });

  assert.ok(error);
  assert.match(error.message, /review|required/i);
});

test('review schema stores rating, review and author', () => {
  const review = new Review({
    ...validReview,
    author: '507f1f77bcf86cd799439011'
  });

  assert.equal(review.rating, 5);
  assert.equal(review.review, 'Excellent campsite.');
  assert.equal(review.author.toString(), '507f1f77bcf86cd799439011');
});
