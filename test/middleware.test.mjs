import test from 'node:test';
import assert from 'node:assert/strict';
import { userAuthentication, storeReturnTo } from '../middlewares/userAuthentication.mjs';
import { ifAuth } from '../middlewares/ifAuth.mjs';
import { isReviewAuthor } from '../middlewares/isReviewAuthor.mjs';
import { Campground } from '../models/campground.mjs';
import { Review } from '../models/review.mjs';

function createResponse() {
  return {
    redirectedTo: null,
    locals: {},
    redirect(path) {
      this.redirectedTo = path;
    }
  };
}

function createRequest(overrides = {}) {
  return {
    isAuthenticated: () => false,
    originalUrl: '/campgrounds/new',
    session: {},
    flash: () => {},
    params: {},
    ...overrides
  };
}

test('userAuthentication redirects unauthenticated users to login', async () => {
  const req = createRequest();
  const res = createResponse();
  let nextCalled = false;

  await userAuthentication(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.redirectedTo, '/campgrounds/login');
  assert.equal(req.session.returnTo, '/campgrounds/new');
});

test('userAuthentication calls next for authenticated users', async () => {
  const req = createRequest({ isAuthenticated: () => true });
  const res = createResponse();
  let nextCalled = false;

  await userAuthentication(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.redirectedTo, null);
});

test('storeReturnTo copies the saved return URL into response locals', () => {
  const req = createRequest({ session: { returnTo: '/campgrounds/123/edit' } });
  const res = createResponse();
  let nextCalled = false;

  storeReturnTo(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.locals.returnTo, '/campgrounds/123/edit');
});

test('storeReturnTo still calls next when there is no saved return URL', () => {
  const req = createRequest({ session: {} });
  const res = createResponse();
  let nextCalled = false;

  storeReturnTo(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.locals.returnTo, undefined);
});

test('ifAuth calls next when the current user owns the campground', async (t) => {
  const author = {
    equals: (id) => id === 'author-1'
  };
  const campground = {
    _id: 'camp-1',
    author: { _id: 'author-1' }
  };

  t.mock.method(Campground, 'findById', async () => campground);

  const req = createRequest({
    params: { id: 'camp-1' },
    user: author
  });
  const res = createResponse();
  let nextCalled = false;

  await ifAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.redirectedTo, null);
});

test('ifAuth redirects when the current user is not the campground owner', async (t) => {
  const author = {
    equals: () => false
  };
  const campground = {
    _id: 'camp-1',
    author: { _id: 'author-1' }
  };
  let flashMessage = null;

  t.mock.method(Campground, 'findById', async () => campground);

  const req = createRequest({
    params: { id: 'camp-1' },
    user: author,
    flash: (_type, message) => {
      flashMessage = message;
    }
  });
  const res = createResponse();

  await ifAuth(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.redirectedTo, '/campgrounds/camp-1');
  assert.equal(flashMessage, 'You Are Not Validated for this action');
});

test('isReviewAuthor calls next when the review belongs to the current user', async (t) => {
  const author = {
    equals: (id) => id === 'author-1'
  };
  const review = { author: 'author-1' };

  t.mock.method(Review, 'findById', async () => review);

  const req = createRequest({
    params: { id: 'camp-1', reviewId: 'review-1' },
    user: author
  });
  const res = createResponse();
  let nextCalled = false;

  await isReviewAuthor(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.redirectedTo, null);
});

test('isReviewAuthor redirects when the review belongs to another user', async (t) => {
  const author = {
    equals: () => false
  };
  const review = { author: 'author-1' };
  let flashMessage = null;

  t.mock.method(Review, 'findById', async () => review);

  const req = createRequest({
    params: { id: 'camp-1', reviewId: 'review-1' },
    user: author,
    flash: (_type, message) => {
      flashMessage = message;
    }
  });
  const res = createResponse();

  await isReviewAuthor(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.redirectedTo, '/campgrounds/camp-1');
  assert.equal(flashMessage, 'You Are Not Validated for this action');
});
