'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildShopOwnedProductQuery, isOwnedByShop } = require('../../src/services/seller-ownership.service');

test('builds a product update query scoped to the active shop', () => {
  assert.deepEqual(
    buildShopOwnedProductQuery({ productId: 'product-1', shopId: 'shop-1' }),
    { _id: 'product-1', product_shop: 'shop-1' },
  );
});

test('recognizes whether an inventory product belongs to the active shop', () => {
  assert.equal(isOwnedByShop({ product_shop: 'shop-1' }, 'shop-1'), true);
  assert.equal(isOwnedByShop({ product_shop: 'shop-2' }, 'shop-1'), false);
});
