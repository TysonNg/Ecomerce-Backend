const test = require('node:test');
const assert = require('node:assert/strict');

const CartService = require('../../src/services/cart.service');

test('merges guest and user cart lines by product id', () => {
  const merged = CartService.mergeCartProducts(
    [
      { productId: 'p1', quantity: 1, name: 'First' },
      { productId: 'p2', quantity: 2, name: 'Second' },
    ],
    [
      { productId: 'p1', quantity: 3, name: 'First' },
    ],
  );

  assert.deepEqual(merged, [
    { productId: 'p1', quantity: 4, name: 'First' },
    { productId: 'p2', quantity: 2, name: 'Second' },
  ]);
});
