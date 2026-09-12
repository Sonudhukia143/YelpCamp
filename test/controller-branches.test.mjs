import test from 'node:test';
import assert from 'node:assert/strict';
import CampgroundController from '../controler/campgrounds.mjs';
import { Campground } from '../models/campground.mjs';

const validCampground = {
  title: 'Pine Valley', price: 20, description: 'A peaceful campground.',
  postcode: '173001', city: 'Shimla', state: 'Himachal Pradesh', country: 'India'
};

function req(overrides = {}) {
  return { body: { campground: validCampground }, files: [], params: {}, user: 'user-1', session: {}, flash() {}, ...overrides };
}
function res() {
  return { redirectedTo: null, redirect(path) { this.redirectedTo = path; } };
}

test('addCampgroundPost catches external geocoding failures', async (t) => {
  t.mock.method(console, 'log', () => {});
  const c = new CampgroundController({ fetch: async () => { throw new Error('geo failed'); } });
  await c.addCampgroundPost(req(), res());
  assert.ok(true);
});

test('editCampgroundPut updates a campground without deleting images', async (t) => {
  const campground = { _id: 'camp-1', images: [], save: t.mock.fn(async () => {}), updateOne: t.mock.fn(async () => {}) };
  t.mock.method(Campground, 'findByIdAndUpdate', async () => campground);
  const r = res();
  let message;
  await new CampgroundController().editCampgroundPut(req({
    params: { id: 'camp-1' },
    body: { campground: validCampground },
    flash: (_type, text) => { message = text; }
  }), r);
  assert.equal(campground.updateOne.mock.calls.length, 0);
  assert.equal(message, 'Succesfully Updated a Campground');
  assert.equal(r.redirectedTo, '/campgrounds/camp-1');
});
