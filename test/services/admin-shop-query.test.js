const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseShopQuery } = require('../../src/services/admin-shop-query.service');
const { buildShopReview } = require('../../src/services/shop-approval.service');

test('search treats regex operators as literal shop names', () => {
  const { filter, limit } = parseShopQuery({ q: '  A.*[B]  ', status: 'all', limit: '500' });
  assert.equal(new RegExp(filter.name.$regex, 'i').test('A.*[B]'), true);
  assert.equal(new RegExp(filter.name.$regex, 'i').test('AxB'), false);
  assert.equal(filter.status, undefined);
  assert.equal(limit, 100);
});
test('invalid filters and pagination are rejected with 400', () => {
  for (const input of [{ status: 'closed' }, { q: {} }, { page: '0' }, { page: '-1' }, { limit: 'foo' }, { page: '1.2' }]) {
    assert.throws(() => parseShopQuery(input), { status: 400 });
  }
});

test('pagination rejects structured parameters and unsafe offsets', () => {
  for (const input of [{ page: ['1'] }, { limit: ['20'] }, { page: {} }, { limit: {} },
    { page: { toString: '1' } }, { limit: { toString: '20' } },
    { page: String(Number.MAX_SAFE_INTEGER), limit: '100' }, { limit: '9'.repeat(400) }]) {
    assert.throws(() => parseShopQuery(input), { status: 400 });
  }
});
test('reject requires a trimmed reason and never grants SHOP', () => {
  const input = { shop: { status: 'pending' }, action: 'reject', ownerRoles: ['USER'], reviewerId: 'admin' };
  for (const reason of [undefined, '', '   ', 'x'.repeat(501), {}]) {
    assert.throws(() => buildShopReview({ ...input, reason }), { status: 400 });
  }
  const result = buildShopReview({ ...input, reason: '  Missing details  ' });
  assert.equal(result.shopUpdate.rejectionReason, 'Missing details');
  assert.deepEqual(result.ownerRoles, ['USER']);
});
