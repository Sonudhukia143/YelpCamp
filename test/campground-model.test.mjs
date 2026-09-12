import test from 'node:test';
import assert from 'node:assert/strict';
import { Campground, forValidation } from '../models/campground.mjs';
import { Review } from '../models/review.mjs';

const validCampground = {
  title: 'Pine Valley Camp',
  price: 25,
  description: 'A quiet campground surrounded by pine trees.',
  postcode: '173001',
  city: 'Shimla',
  state: 'Himachal Pradesh',
  country: 'India'
};

test('campground validation accepts a valid campground', () => {
  const { error, value } = forValidation(validCampground);
  assert.equal(error, undefined);
  assert.equal(value.title, validCampground.title);
  assert.equal(value.price, validCampground.price);
});

test('campground validation rejects missing required fields', () => {
  const { error } = forValidation({ title: 'Incomplete Campground' });
  assert.ok(error);
  assert.match(error.message, /price|required/i);
});

test('campground validation rejects a negative price', () => {
  const { error } = forValidation({ ...validCampground, price: -1 });
  assert.ok(error);
  assert.match(error.message, /greater than or equal to 0/i);
});

test('campground validation rejects an empty title', () => {
  const { error } = forValidation({ ...validCampground, title: '' });
  assert.ok(error);
});

test('campground schema exposes the image thumbnail virtual', () => {
  const campground = new Campground({
    ...validCampground,
    images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', filename: 'sample.jpg' }],
    geometry: { type: 'Point', coordinates: [77.1, 31.1] }
  });
  assert.equal(campground.images[0].thumbnail, 'https://res.cloudinary.com/demo/image/upload/w_200/sample.jpg');
});

test('campground deletion hook removes attached reviews', async (t) => {
  const posts = Campground.schema.s.hooks._posts.get('findOneAndDelete');
  const hook = posts[0].fn;
  const deleteMany = t.mock.method(Review, 'deleteMany', async () => ({ deletedCount: 2 }));

  await hook({ review: ['review-1', 'review-2'] });

  assert.equal(deleteMany.mock.calls.length, 1);
  assert.deepEqual(deleteMany.mock.calls[0].arguments[0], { _id: { $in: ['review-1', 'review-2'] } });
});

test('campground deletion hook skips review deletion when there are no reviews', async (t) => {
  const posts = Campground.schema.s.hooks._posts.get('findOneAndDelete');
  const hook = posts[0].fn;
  const deleteMany = t.mock.method(Review, 'deleteMany', async () => ({ deletedCount: 0 }));

  await hook({ review: [] });

  assert.equal(deleteMany.mock.calls.length, 0);
});
