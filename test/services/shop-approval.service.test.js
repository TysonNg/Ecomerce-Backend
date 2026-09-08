'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildShopReview } = require('../../src/services/shop-approval.service');

test('approving a pending shop activates it and grants the SHOP role', () => {
  const reviewedAt = new Date('2026-09-08T00:00:00.000Z');

  assert.deepEqual(
    buildShopReview({
      shop: { _id: 'shop-1', status: 'pending' },
      ownerRoles: ['USER'],
      action: 'approve',
      reviewerId: 'admin-1',
      reviewedAt,
    }),
    {
      shopUpdate: { status: 'active', reviewedBy: 'admin-1', reviewedAt, rejectionReason: '' },
      ownerRoles: ['USER', 'SHOP'],
    },
  );
});

test('rejecting a pending shop leaves the owner without the SHOP role', () => {
  assert.deepEqual(
    buildShopReview({
      shop: { _id: 'shop-1', status: 'pending' },
      ownerRoles: ['USER'],
      action: 'reject',
      reason: 'Incomplete shop details',
      reviewerId: 'admin-1',
      reviewedAt: new Date('2026-09-08T00:00:00.000Z'),
    }).ownerRoles,
    ['USER'],
  );
});

test('does not review a shop that is not pending', () => {
  assert.throws(
    () => buildShopReview({
      shop: { _id: 'shop-1', status: 'rejected' },
      ownerRoles: ['USER'],
      action: 'approve',
      reviewerId: 'admin-1',
    }),
    { message: 'Only pending shops can be reviewed' },
  );
});
