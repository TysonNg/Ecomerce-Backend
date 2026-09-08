const test = require('node:test');
const assert = require('node:assert/strict');

const DiscountServices = require('../../src/services/discount.service');

const NOW = new Date('2026-09-08T00:00:00.000Z');

const activeDiscount = {
  discount_is_active: true,
  discount_start_date: new Date('2026-01-01T00:00:00.000Z'),
  discount_end_date: new Date('2027-01-01T00:00:00.000Z'),
  discount_max_use: 1,
  discount_max_uses_per_user: 1,
  discount_user_used: [],
};

test('selects active all and matching specific codes for a shop cart', () => {
  const selected = DiscountServices.selectAvailableDiscounts({
    discounts: [
      { ...activeDiscount, discount_code: 'ALL10', discount_applies_to: 'all', discount_product_ids: [] },
      { ...activeDiscount, discount_code: 'P2FIX', discount_applies_to: 'specific', discount_product_ids: ['p2'] },
      { ...activeDiscount, discount_code: 'P3FIX', discount_applies_to: 'specific', discount_product_ids: ['p3'] },
    ],
    productIds: ['p1', 'p2'],
    userId: 'u1',
    now: NOW,
  });

  assert.deepEqual(selected.map(({ discount_code }) => discount_code), ['ALL10', 'P2FIX']);
});
