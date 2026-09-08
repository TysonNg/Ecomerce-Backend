const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isDiscountApplicableToProducts,
} = require('../../src/services/discount-eligibility.service');

const NOW = new Date('2026-09-08T00:00:00.000Z');

const baseDiscount = {
  discount_is_active: true,
  discount_start_date: new Date('2026-01-01T00:00:00.000Z'),
  discount_end_date: new Date('2027-01-01T00:00:00.000Z'),
  discount_max_use: 2,
  discount_max_uses_per_user: 1,
  discount_user_used: [],
};

test('accepts an all-products code for any cart product', () => {
  assert.equal(isDiscountApplicableToProducts({
    discount: { ...baseDiscount, discount_applies_to: 'all', discount_product_ids: [] },
    productIds: ['p1'],
    userId: 'u1',
    now: NOW,
  }), true);
});

test('accepts a specific code only when one cart product matches', () => {
  assert.equal(isDiscountApplicableToProducts({
    discount: { ...baseDiscount, discount_applies_to: 'specific', discount_product_ids: ['p2'] },
    productIds: ['p1', 'p2'],
    userId: 'u1',
    now: NOW,
  }), true);

  assert.equal(isDiscountApplicableToProducts({
    discount: { ...baseDiscount, discount_applies_to: 'specific', discount_product_ids: ['p2'] },
    productIds: ['p1'],
    userId: 'u1',
    now: NOW,
  }), false);
});

test('excludes expired, depleted, and already-used codes', () => {
  assert.equal(isDiscountApplicableToProducts({
    discount: { ...baseDiscount, discount_end_date: new Date('2026-09-07T00:00:00.000Z'), discount_applies_to: 'all' },
    productIds: ['p1'], userId: 'u1', now: NOW,
  }), false);
  assert.equal(isDiscountApplicableToProducts({
    discount: { ...baseDiscount, discount_max_use: 0, discount_applies_to: 'all' },
    productIds: ['p1'], userId: 'u1', now: NOW,
  }), false);
  assert.equal(isDiscountApplicableToProducts({
    discount: { ...baseDiscount, discount_user_used: ['u1'], discount_applies_to: 'all' },
    productIds: ['p1'], userId: 'u1', now: NOW,
  }), false);
});
