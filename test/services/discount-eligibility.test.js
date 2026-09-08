const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getDiscountEligibility,
} = require('../../src/services/discount-eligibility.service');

const NOW = new Date('2026-09-08T00:00:00.000Z');

const baseDiscount = {
  discount_type: 'fix_amount',
  discount_value: 20,
  discount_applies_to: 'all',
  discount_product_ids: [],
  discount_min_order_value: 0,
  discount_max_order_value: 0,
  discount_is_active: true,
  discount_start_date: new Date('2026-01-01T00:00:00.000Z'),
  discount_end_date: new Date('2027-01-01T00:00:00.000Z'),
  discount_max_use: 2,
  discount_max_uses_per_user: 1,
  discount_user_used: [],
};

test('calculates a fixed discount once for all shop products', () => {
  const result = getDiscountEligibility({
    discount: baseDiscount,
    shopProducts: [{ productId: 'p1', price: 50, quantity: 2 }],
    userId: 'u1',
    now: NOW,
  });

  assert.deepEqual(result, {
    applicableProducts: [{ productId: 'p1', price: 50, quantity: 2 }],
    subtotal: 100,
    discountAmount: 20,
    total: 80,
  });
});

test('limits a specific discount to matching products', () => {
  const result = getDiscountEligibility({
    discount: {
      ...baseDiscount,
      discount_applies_to: 'specific',
      discount_product_ids: ['p2'],
      discount_type: 'percentage',
      discount_value: 10,
    },
    shopProducts: [
      { productId: 'p1', price: 50, quantity: 1 },
      { productId: 'p2', price: 80, quantity: 2 },
    ],
    userId: 'u1',
    now: NOW,
  });

  assert.equal(result.subtotal, 160);
  assert.equal(result.discountAmount, 16);
  assert.equal(result.total, 144);
});

test('rejects an expired discount', () => {
  assert.throws(
    () => getDiscountEligibility({
      discount: { ...baseDiscount, discount_end_date: new Date('2026-09-07T23:59:59.000Z') },
      shopProducts: [{ productId: 'p1', price: 50, quantity: 1 }],
      userId: 'u1',
      now: NOW,
    }),
    (error) => error.code === 'DISCOUNT_EXPIRED',
  );
});

test('rejects an inactive discount', () => {
  assert.throws(
    () => getDiscountEligibility({
      discount: { ...baseDiscount, discount_is_active: false },
      shopProducts: [{ productId: 'p1', price: 50, quantity: 1 }],
      userId: 'u1',
      now: NOW,
    }),
    (error) => error.code === 'DISCOUNT_INACTIVE',
  );
});

test('rejects a discount with no remaining uses', () => {
  assert.throws(
    () => getDiscountEligibility({
      discount: { ...baseDiscount, discount_max_use: 0 },
      shopProducts: [{ productId: 'p1', price: 50, quantity: 1 }],
      userId: 'u1',
      now: NOW,
    }),
    (error) => error.code === 'DISCOUNT_DEPLETED',
  );
});

test('rejects an order below the discount minimum', () => {
  assert.throws(
    () => getDiscountEligibility({
      discount: { ...baseDiscount, discount_min_order_value: 100 },
      shopProducts: [{ productId: 'p1', price: 99, quantity: 1 }],
      userId: 'u1',
      now: NOW,
    }),
    (error) => error.code === 'DISCOUNT_MINIMUM_NOT_MET',
  );
});

test('caps a percentage discount at its configured maximum', () => {
  const result = getDiscountEligibility({
    discount: {
      ...baseDiscount,
      discount_type: 'percentage',
      discount_value: 50,
      discount_max_order_value: 30,
    },
    shopProducts: [{ productId: 'p1', price: 100, quantity: 1 }],
    userId: 'u1',
    now: NOW,
  });

  assert.equal(result.discountAmount, 30);
  assert.equal(result.total, 70);
});

test('rejects a discount after the user reaches their use limit', () => {
  assert.throws(
    () => getDiscountEligibility({
      discount: { ...baseDiscount, discount_user_used: ['u1'] },
      shopProducts: [{ productId: 'p1', price: 50, quantity: 1 }],
      userId: 'u1',
      now: NOW,
    }),
    (error) => error.code === 'DISCOUNT_ALREADY_USED',
  );
});
