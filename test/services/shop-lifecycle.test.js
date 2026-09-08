const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canTransitionShop,
  createShopPayload,
} = require('../../src/services/shop-lifecycle.service');

test('allows a pending shop to be approved but never reactivates a rejected shop', () => {
  assert.equal(canTransitionShop({ from: 'pending', to: 'active' }), true);
  assert.equal(canTransitionShop({ from: 'pending', to: 'rejected' }), true);
  assert.equal(canTransitionShop({ from: 'rejected', to: 'active' }), false);
});

test('creates a pending shop payload with a normalized slug', () => {
  assert.deepEqual(
    createShopPayload({ ownerId: 'user-1', name: 'Nhật Store', logo: '', description: 'Electronics' }),
    { ownerId: 'user-1', name: 'Nhật Store', slug: 'nhat-store', logo: '', description: 'Electronics', status: 'pending' },
  );
});
