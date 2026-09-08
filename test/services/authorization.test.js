const test = require('node:test');
const assert = require('node:assert/strict');

const { hasRequiredRole, mergeRoles } = require('../../src/auth/roles');

test('recognizes a required role', () => {
  assert.equal(hasRequiredRole(['USER'], ['SHOP']), false);
  assert.equal(hasRequiredRole(['SHOP'], ['SHOP']), true);
  assert.equal(hasRequiredRole(['USER', 'ADMIN'], ['SHOP', 'ADMIN']), true);
});

test('adds a role once without removing existing roles', () => {
  assert.deepEqual(mergeRoles(['USER'], 'ADMIN'), ['USER', 'ADMIN']);
  assert.deepEqual(mergeRoles(['USER', 'ADMIN'], 'ADMIN'), ['USER', 'ADMIN']);
});
