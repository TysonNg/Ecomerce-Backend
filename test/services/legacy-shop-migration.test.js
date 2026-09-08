'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { collectLegacyOwnerIds, createLegacyShopPayload } = require('../../src/services/legacy-shop-migration.service');

test('collects each legacy owner only once across products and discounts', () => {
  assert.deepEqual(
    collectLegacyOwnerIds({
      productOwnerIds: ['user-1', 'user-2', 'user-1'],
      discountOwnerIds: ['user-2', 'user-3'],
    }),
    ['user-1', 'user-2', 'user-3'],
  );
});

test('ignores ownership ids that already refer to shops', () => {
  assert.deepEqual(
    collectLegacyOwnerIds({
      productOwnerIds: ['legacy-user', 'shop-id'],
      discountOwnerIds: ['shop-id'],
      shopIds: ['shop-id'],
    }),
    ['legacy-user'],
  );
});

test('creates an active deterministic legacy shop payload', () => {
  assert.deepEqual(
    createLegacyShopPayload('507f1f77bcf86cd799439011'),
    {
      ownerId: '507f1f77bcf86cd799439011',
      name: 'Legacy shop 507f1f77bcf86cd799439011',
      slug: 'legacy-507f1f77bcf86cd799439011',
      status: 'active',
    },
  );
});
