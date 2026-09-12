import test from 'node:test';
import assert from 'node:assert/strict';
import cloudinary from 'cloudinary';
import fetch from 'node-fetch';
import CampgroundController from '../controler/campgrounds.mjs';
import ReviewController from '../controler/review.mjs';
import UserController from '../controler/user.mjs';
import { Campground } from '../models/campground.mjs';
import { Review } from '../models/review.mjs';
import { User } from '../models/user.mjs';

function response() {
  return {
    rendered: null,
    redirectedTo: null,
    redirect(path) { this.redirectedTo = path; },
    render(view, data) { this.rendered = { view, data }; }
  };
}

function request(overrides = {}) {
  return {
    body: { campground: {} },
    files: [],
    params: {},
    user: { _id: 'user-1' },
    session: {},
    flash() {},
    ...overrides
  };
}

const validCampground = {
  title: 'Pine Valley',
  price: 20,
  description: 'A peaceful campground.',
  postcode: '173001',
  city: 'Shimla',
  state: 'Himachal Pradesh',
  country: 'India'
};

test('CampgroundController allCampgrounds renders loaded campgrounds', async (t) => {
  const controller = new CampgroundController();
  const campgrounds = [{ title: 'Pine Valley' }];
  t.mock.method(Campground, 'find', async () => campgrounds);
  process.env.MAPPLES_MAP_API_KEY = 'map-key';

  const res = response();
  await controller.allCampgrounds(request(), res);

  assert.deepEqual(res.rendered, {
    view: 'campgrounds/index.ejs',
    data: { campgrounds, data: { MAPPLES_MAP_API_KEY: 'map-key' } }
  });
});

test('CampgroundController addCampgroundGet renders the new page', async () => {
  const controller = new CampgroundController();
  const res = response();

  await controller.addCampgroundGet(request(), res);

  assert.equal(res.rendered.view, 'campgrounds/new');
});

test('CampgroundController addCampgroundGet catches rendering errors', async (t) => {
  const controller = new CampgroundController();
  const res = { render() { throw new Error('render failed'); } };
  const originalLog = console.log;
  t.mock.method(console, 'log', () => {});

  await controller.addCampgroundGet(request(), res);

  console.log = originalLog;
  assert.equal(console.log, originalLog);
});

test('CampgroundController addCampgroundPost redirects invalid data', async () => {
  const controller = new CampgroundController();
  let flashMessage;
  const req = request({
    body: { campground: {} },
    flash: (_type, message) => { flashMessage = message; }
  });
  const res = response();

  await controller.addCampgroundPost(req, res);

  assert.equal(flashMessage, 'Enter Valid Data In Your Form ');
  assert.equal(res.redirectedTo, 'campgrounds/new');
});

test('CampgroundController addCampgroundPost creates and redirects a valid campground', async (t) => {
  const controller = new CampgroundController();
  const req = request({
    body: { campground: { ...validCampground, geometry: { coordinates: [0, 0] } } },
    files: [{ path: '/uploads/photo.jpg', filename: 'photo.jpg' }],
    user: 'author-1'
  });
  const res = response();
  let flashMessage;

  t.mock.method(fetch, 'default', async () => ({
    json: async () => ({ results: [{ lat: 31.1, lon: 77.1 }] })
  }));
  t.mock.method(Campground.prototype, 'save', async function () { return this; });
  req.flash = (_type, message) => { flashMessage = message; };

  await controller.addCampgroundPost(req, res);

  assert.equal(flashMessage, 'Succesfully Created a Campground ');
  assert.match(res.redirectedTo, /^\/campgrounds\//);
});

test('CampgroundController showCampgroundGet populates and renders a campground', async (t) => {
  const controller = new CampgroundController();
  const campground = { title: 'Pine Valley' };
  const chain = {
    populate() { return this; }
  };
  t.mock.method(Campground, 'findById', () => chain);
  chain.populate = t.mock.fn(function () { return this; });
  chain.then = (resolve) => Promise.resolve(campground).then(resolve);

  const res = response();
  await controller.showCampgroundGet(request({ params: { id: 'camp-1' } }), res);

  assert.equal(res.rendered.data.campground, campground);
  assert.equal(chain.populate.mock.calls.length, 2);
});

test('CampgroundController editCampgroundGet loads and renders campground', async (t) => {
  const controller = new CampgroundController();
  const campground = { title: 'Pine Valley' };
  t.mock.method(Campground, 'findById', async () => campground);
  const res = response();

  await controller.editCampgroundGet(request({ params: { id: 'camp-1' }, user: 'author-1' }), res);

  assert.deepEqual(res.rendered.data, { campground, author: 'author-1' });
});

test('CampgroundController editCampgroundPut redirects invalid data', async () => {
  const controller = new CampgroundController();
  const res = response();

  await controller.editCampgroundPut(
    request({ params: { id: 'camp-1' }, body: { campground: {} } }),
    res
  );

  assert.equal(res.redirectedTo, 'camp-1/edit');
});

test('CampgroundController editCampgroundPut updates images and deletes selected Cloudinary images', async (t) => {
  const controller = new CampgroundController();
  const campground = {
    _id: 'camp-1',
    images: [],
    save: t.mock.fn(async function () { return this; }),
    updateOne: t.mock.fn(async () => {})
  };
  t.mock.method(Campground, 'findByIdAndUpdate', async () => campground);
  t.mock.method(cloudinary.uploader, 'destroy', async () => ({ result: 'ok' }));

  const req = request({
    params: { id: 'camp-1' },
    body: { campground: validCampground, deleteImages: ['old.jpg'] },
    files: [{ path: '/uploads/new.jpg', filename: 'new.jpg' }]
  });
  const res = response();
  let flashMessage;
  req.flash = (_type, message) => { flashMessage = message; };

  await controller.editCampgroundPut(req, res);

  assert.deepEqual(campground.images, [{ url: '/uploads/new.jpg', filename: 'new.jpg' }]);
  assert.equal(campground.save.mock.calls.length, 1);
  assert.equal(campground.updateOne.mock.calls.length, 1);
  assert.equal(flashMessage, 'Succesfully Updated a Campground');
  assert.equal(res.redirectedTo, '/campgrounds/camp-1');
});

test('CampgroundController deleteCampground deletes and redirects', async (t) => {
  const controller = new CampgroundController();
  t.mock.method(Campground, 'findByIdAndDelete', async () => ({ _id: 'camp-1' }));
  const req = request({ params: { id: 'camp-1' } });
  const res = response();
  let flashMessage;
  req.flash = (_type, message) => { flashMessage = message; };

  await controller.deleteCampground(req, res);

  assert.equal(flashMessage, 'Succesfully Deleted a Campground ');
  assert.equal(res.redirectedTo, '/campgrounds');
});

test('ReviewController reviewPost creates a review and attaches it to campground', async (t) => {
  const controller = new ReviewController();
  const campground = { review: [], save: t.mock.fn(async () => {}) };
  t.mock.method(Campground, 'findById', async () => campground);
  t.mock.method(Review.prototype, 'save', async function () { return this; });
  const req = request({
    params: { id: 'camp-1' },
    body: { rating: 5, review: 'Excellent' },
    user: 'author-1'
  });
  const res = response();
  let flashMessage;
  req.flash = (_type, message) => { flashMessage = message; };

  await controller.reviewPost(req, res);

  assert.equal(campground.review.length, 1);
  assert.equal(flashMessage, 'Succesfully Created a Review');
  assert.equal(res.redirectedTo, '/campgrounds/camp-1');
});

test('ReviewController reviewPost catches failures', async (t) => {
  const controller = new ReviewController();
  t.mock.method(Campground, 'findById', async () => { throw new Error('database failed'); });
  t.mock.method(console, 'log', () => {});

  await controller.reviewPost(request({ params: { id: 'camp-1' } }), response());

  assert.ok(true);
});

test('ReviewController deleteReview deletes an existing review', async (t) => {
  const controller = new ReviewController();
  t.mock.method(Review, 'findByIdAndDelete', async () => ({ _id: 'review-1' }));
  const req = request({ params: { id: 'camp-1', reviewId: 'review-1' } });
  const res = response();
  let flashMessage;
  req.flash = (_type, message) => { flashMessage = message; };

  await controller.deleteReview(req, res);

  assert.equal(flashMessage, 'Succesfully Deleted a Review');
  assert.equal(res.redirectedTo, '/campgrounds/camp-1');
});

test('ReviewController deleteReview handles a missing review', async (t) => {
  const controller = new ReviewController();
  t.mock.method(Review, 'findByIdAndDelete', async () => null);
  t.mock.method(console, 'log', () => {});

  await controller.deleteReview(
    request({ params: { id: 'camp-1', reviewId: 'missing' } }),
    response()
  );

  assert.ok(true);
});

test('ReviewController deleteReview catches deletion failures', async (t) => {
  const controller = new ReviewController();
  t.mock.method(Review, 'findByIdAndDelete', async () => { throw new Error('delete failed'); });
  t.mock.method(console, 'log', () => {});

  await controller.deleteReview(
    request({ params: { id: 'camp-1', reviewId: 'review-1' } }),
    response()
  );

  assert.ok(true);
});

test('UserController registerUserGet renders registration page', () => {
  const controller = new UserController();
  const res = response();
  controller.registerUserGet(request(), res);

  assert.equal(res.rendered.view, 'users/register.ejs');
});

test('UserController registerUserPost registers and logs in user', async (t) => {
  const controller = new UserController();
  const registeredUser = { username: 'campuser' };
  t.mock.method(User, 'register', async () => registeredUser);
  const req = request({
    body: { username: 'campuser', gmail: 'campuser@example.com', password: 'secret' },
    login: (user, callback) => callback(null),
    flash: t.mock.fn()
  });
  const res = response();

  await controller.registerUserPost(req, res, () => {});

  assert.equal(req.flash.mock.calls.length, 1);
  assert.equal(res.redirectedTo, '/campgrounds');
});

test('UserController registerUserPost passes login errors to next', async (t) => {
  const controller = new UserController();
  t.mock.method(User, 'register', async () => ({ username: 'campuser' }));
  const loginError = new Error('login failed');
  const req = request({
    body: { username: 'campuser', gmail: 'campuser@example.com', password: 'secret' },
    login: (_user, callback) => callback(loginError)
  });
  const res = response();
  let nextError;

  await controller.registerUserPost(req, res, (error) => { nextError = error; });

  assert.equal(nextError, loginError);
});

test('UserController registerUserPost handles registration errors', async (t) => {
  const controller = new UserController();
  t.mock.method(User, 'register', async () => { throw new Error('duplicate'); });
  const req = request({ flash: t.mock.fn() });
  const res = response();

  await controller.registerUserPost(req, res, () => {});

  assert.equal(req.flash.mock.calls[0].arguments[0], 'error');
  assert.equal(res.redirectedTo, '/campgrounds/register');
});

test('UserController loginUserGet renders login page', () => {
  const controller = new UserController();
  const res = response();
  controller.loginUserGet(request(), res);

  assert.equal(res.rendered.view, 'users/login.ejs');
});

test('UserController loginUserPost redirects to stored return URL', async () => {
  const controller = new UserController();
  const req = request({ session: { save: (callback) => callback(null) }, flash: tMockFlash() });
  const res = response();
  res.locals = { returnTo: '/campgrounds/camp-1/edit' };

  await controller.loginUserPost(req, res, () => {});

  assert.equal(res.redirectedTo, '/campgrounds/camp-1/edit');
});

test('UserController loginUserPost passes session errors to next', async () => {
  const controller = new UserController();
  const sessionError = new Error('session failed');
  const req = request({ session: { save: (callback) => callback(sessionError) }, flash: () => {} });
  const res = response();
  let nextError;

  await controller.loginUserPost(req, res, (error) => { nextError = error; });

  assert.equal(nextError, sessionError);
});

test('UserController loginUserPost defaults to campgrounds', async () => {
  const controller = new UserController();
  const req = request({ session: { save: (callback) => callback(null) }, flash: () => {} });
  const res = response();

  await controller.loginUserPost(req, res, () => {});

  assert.equal(res.redirectedTo, '/campgrounds');
});

test('UserController logOutUser destroys session and redirects', async () => {
  const controller = new UserController();
  const req = request({ session: { destroy: async () => {} } });
  const res = response();

  await controller.logOutUser(req, res, () => {});

  assert.equal(res.redirectedTo, '/campgrounds');
});

test('UserController logOutUser passes session errors to next', async () => {
  const controller = new UserController();
  const sessionError = new Error('destroy failed');
  const req = request({ session: { destroy: async () => { throw sessionError; } } });
  const res = response();
  let nextError;

  await controller.logOutUser(req, res, (error) => { nextError = error; });

  assert.equal(nextError, sessionError);
});

function tMockFlash() {
  return () => {};
}
