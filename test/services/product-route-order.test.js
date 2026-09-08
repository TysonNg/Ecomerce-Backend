'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const productRoutes = require('../../src/routes/product');

test('restricts the public product detail route to Mongo object ids', () => {
  const detailLayer = productRoutes.stack.find((layer) => layer.route?.path.includes(':product_id'));
  assert.equal(detailLayer.route.path, '/:product_id([0-9a-fA-F]{24})');
});
