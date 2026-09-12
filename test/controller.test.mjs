import test from 'node:test';
import assert from 'node:assert/strict';
import CampgroundController from '../controler/campgrounds.mjs';
import ReviewController from '../controler/review.mjs';
import UserController from '../controler/user.mjs';
import { Campground } from '../models/campground.mjs';
import { Review } from '../models/review.mjs';
import { User } from '../models/user.mjs';

const validCampground = {
  title: 'Pine Valley', price: 20, description: 'A peaceful campground.',
  postcode: '173001', city: 'Shimla', state: 'Himachal Pradesh', country: 'India'
};

function res() {
  return { rendered: null, redirectedTo: null, locals: {},
    redirect(path) { this.redirectedTo = path; },
    render(view, data) { this.rendered = { view, data }; } };
}
function req(overrides = {}) {
  return { body: { campground: {} }, files: [], params: {}, user: 'user-1',
    session: {}, flash() {}, ...overrides };
}

test('campground list and page controllers render', async (t) => {
  const c = new CampgroundController();
  const campgrounds = [{ title: 'Pine Valley' }];
  t.mock.method(Campground, 'find', async () => campgrounds);
  process.env.MAPPLES_MAP_API_KEY = 'map-key';
  const r1 = res();
  await c.allCampgrounds(req(), r1);
  assert.deepEqual(r1.rendered.data.campgrounds, campgrounds);
  const r2 = res();
  await c.addCampgroundGet(req(), r2);
  assert.equal(r2.rendered.view, 'campgrounds/new');
});

test('addCampgroundGet catches render errors', async (t) => {
  t.mock.method(console, 'log', () => {});
  await new CampgroundController().addCampgroundGet(req(), { render() { throw new Error('fail'); } });
  assert.ok(true);
});

test('addCampgroundPost rejects invalid input', async () => {
  let message;
  const r = res();
  await new CampgroundController().addCampgroundPost(req({ flash: (_t, m) => { message = m; } }), r);
  assert.equal(message, 'Enter Valid Data In Your Form ');
  assert.equal(r.redirectedTo, 'campgrounds/new');
});

test('addCampgroundPost creates a valid campground', async (t) => {
  const fakeFetch = async () => ({ json: async () => ({ results: [{ lat: 31.1, lon: 77.1 }] }) });
  const c = new CampgroundController({ fetch: fakeFetch });
  t.mock.method(Campground.prototype, 'save', async function () { return this; });
  let message;
  const r = res();
  await c.addCampgroundPost(req({
    body: { campground: { ...validCampground, geometry: { coordinates: [0, 0] } } },
    files: [{ path: '/uploads/photo.jpg', filename: 'photo.jpg' }],
    flash: (_t, m) => { message = m; }
  }), r);
  assert.equal(message, 'Succesfully Created a Campground ');
  assert.match(r.redirectedTo, /^\/campgrounds\//);
});

test('showCampgroundGet populates review and author then renders', async (t) => {
  const c = new CampgroundController();
  const campground = { title: 'Pine Valley' };
  const query = { populate: t.mock.fn(function () { return this; }) };
  query.then = (resolve) => Promise.resolve(campground).then(resolve);
  t.mock.method(Campground, 'findById', () => query);
  const r = res();
  await c.showCampgroundGet(req({ params: { id: 'camp-1' } }), r);
  assert.equal(r.rendered.data.campground, campground);
  assert.equal(query.populate.mock.calls.length, 2);
});

test('editCampgroundGet renders campground and author', async (t) => {
  const campground = { title: 'Pine Valley' };
  t.mock.method(Campground, 'findById', async () => campground);
  const r = res();
  await new CampgroundController().editCampgroundGet(req({ params: { id: 'camp-1' }, user: 'author-1' }), r);
  assert.deepEqual(r.rendered.data, { campground, author: 'author-1' });
});

test('editCampgroundPut rejects invalid input', async () => {
  const r = res();
  await new CampgroundController().editCampgroundPut(req({ params: { id: 'camp-1' } }), r);
  assert.equal(r.redirectedTo, 'camp-1/edit');
});

test('editCampgroundPut updates images and deletes selected images', async (t) => {
  const campground = { _id: 'camp-1', images: [], save: t.mock.fn(async () => {}), updateOne: t.mock.fn(async () => {}) };
  const fakeCloudinary = { uploader: { destroy: t.mock.fn(async () => ({ result: 'ok' })) } };
  t.mock.method(Campground, 'findByIdAndUpdate', async () => campground);
  const c = new CampgroundController({ cloudinary: fakeCloudinary });
  let message;
  const r = res();
  await c.editCampgroundPut(req({
    params: { id: 'camp-1' }, body: { campground: validCampground, deleteImages: ['old.jpg'] },
    files: [{ path: '/uploads/new.jpg', filename: 'new.jpg' }],
    flash: (_t, m) => { message = m; }
  }), r);
  assert.deepEqual(campground.images, [{ url: '/uploads/new.jpg', filename: 'new.jpg' }]);
  assert.equal(fakeCloudinary.uploader.destroy.mock.calls.length, 1);
  assert.equal(campground.updateOne.mock.calls.length, 1);
  assert.equal(message, 'Succesfully Updated a Campground');
  assert.equal(r.redirectedTo, '/campgrounds/camp-1');
});

test('deleteCampground deletes and redirects', async (t) => {
  t.mock.method(Campground, 'findByIdAndDelete', async () => ({ _id: 'camp-1' }));
  let message;
  const r = res();
  await new CampgroundController().deleteCampground(req({ params: { id: 'camp-1' }, flash: (_t, m) => { message = m; } }), r);
  assert.equal(message, 'Succesfully Deleted a Campground ');
  assert.equal(r.redirectedTo, '/campgrounds');
});

test('reviewPost creates review and attaches it to campground', async (t) => {
  const campground = { review: [], save: t.mock.fn(async () => {}) };
  t.mock.method(Campground, 'findById', async () => campground);
  t.mock.method(Review.prototype, 'save', async function () { return this; });
  let message;
  const r = res();
  await new ReviewController().reviewPost(req({ params: { id: 'camp-1' }, body: { rating: 5, review: 'Excellent' }, flash: (_t, m) => { message = m; } }), r);
  assert.equal(campground.review.length, 1);
  assert.equal(message, 'Succesfully Created a Review');
  assert.equal(r.redirectedTo, '/campgrounds/camp-1');
});

test('reviewPost catches database errors', async (t) => {
  t.mock.method(Campground, 'findById', async () => { throw new Error('db'); });
  t.mock.method(console, 'log', () => {});
  await new ReviewController().reviewPost(req({ params: { id: 'camp-1' } }), res());
  assert.ok(true);
});

test('deleteReview handles existing, missing and failing reviews', async (t) => {
  const c = new ReviewController();
  let message;
  t.mock.method(Review, 'findByIdAndDelete', async () => ({ _id: 'review-1' }));
  const r = res();
  await c.deleteReview(req({ params: { id: 'camp-1', reviewId: 'review-1' }, flash: (_t, m) => { message = m; } }), r);
  assert.equal(message, 'Succesfully Deleted a Review');
  t.mock.method(Review, 'findByIdAndDelete', async () => null);
  t.mock.method(console, 'log', () => {});
  await c.deleteReview(req({ params: { id: 'camp-1', reviewId: 'missing' } }), res());
  t.mock.method(Review, 'findByIdAndDelete', async () => { throw new Error('db'); });
  await c.deleteReview(req({ params: { id: 'camp-1', reviewId: 'review-1' } }), res());
  assert.ok(true);
});

test('user controller renders register and login pages', () => {
  const c = new UserController();
  const r1 = res(); c.registerUserGet(req(), r1);
  const r2 = res(); c.loginUserGet(req(), r2);
  assert.equal(r1.rendered.view, 'users/register.ejs');
  assert.equal(r2.rendered.view, 'users/login.ejs');
});

test('registerUserPost registers, logs in and redirects', async (t) => {
  t.mock.method(User, 'register', async () => ({ username: 'campuser' }));
  const reqObj = req({
    body: { username: 'campuser', gmail: 'campuser@example.com', password: 'secret' },
    login: (_user, cb) => cb(null), flash: t.mock.fn()
  });
  const r = res();
  await new UserController().registerUserPost(reqObj, r, () => {});
  assert.equal(reqObj.flash.mock.calls.length, 1);
  assert.equal(r.redirectedTo, '/campgrounds');
});

test('registerUserPost forwards login errors and handles registration errors', async (t) => {
  t.mock.method(User, 'register', async () => ({ username: 'campuser' }));
  const loginError = new Error('login');
  let nextError;
  await new UserController().registerUserPost(req({ body: { username: 'u', gmail: 'g', password: 'p' }, login: (_u, cb) => cb(loginError) }), res(), (e) => { nextError = e; });
  assert.equal(nextError, loginError);
  t.mock.method(User, 'register', async () => { throw new Error('duplicate'); });
  let message;
  const r = res();
  await new UserController().registerUserPost(req({ body: { username: 'u', gmail: 'g', password: 'p' }, flash: (_t, m) => { message = m; } }), r, () => {});
  assert.equal(message, 'Username or Gmail Already In Existence');
  assert.equal(r.redirectedTo, '/campgrounds/register');
});

test('loginUserPost redirects to return URL or default and forwards save errors', async () => {
  const c = new UserController();
  const r1 = res(); r1.locals.returnTo = '/campgrounds/camp-1/edit';
  await c.loginUserPost(req({ session: { save: (cb) => cb(null) } }), r1, () => {});
  assert.equal(r1.redirectedTo, '/campgrounds/camp-1/edit');
  const r2 = res();
  await c.loginUserPost(req({ session: { save: (cb) => cb(null) } }), r2, () => {});
  assert.equal(r2.redirectedTo, '/campgrounds');
  const error = new Error('session'); let nextError;
  await c.loginUserPost(req({ session: { save: (cb) => cb(error) } }), res(), (e) => { nextError = e; });
  assert.equal(nextError, error);
});

test('logOutUser redirects and forwards destroy errors', async () => {
  const c = new UserController();
  const r = res();
  await c.logOutUser(req({ session: { destroy: async () => {} } }), r, () => {});
  assert.equal(r.redirectedTo, '/campgrounds');
  const error = new Error('destroy'); let nextError;
  await c.logOutUser(req({ session: { destroy: async () => { throw error; } } }), res(), (e) => { nextError = e; });
  assert.equal(nextError, error);
});
