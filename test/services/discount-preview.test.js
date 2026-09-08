const test = require('node:test');
const assert = require('node:assert/strict');

const DiscountServices = require('../../src/services/discount.service');

test('previews a fixed discount without mutating the discount document', () => {
  const discount = {
    discount_type: 'fix_amount',
    discount_value: 25,
    discount_applies_to: 'all',
    discount_product_ids: [],
    discount_min_order_value: 0,
    discount_max_order_value: 0,
    discount_is_active: true,
    discount_start_date: new Date('2026-01-01T00:00:00.000Z'),
    discount_end_date: new Date('2027-01-01T00:00:00.000Z'),
    discount_max_use: 3,
    discount_max_uses_per_user: 1,
    discount_user_used: [],
  };

  const result = DiscountServices.previewDiscount({
    discount,
    products: [{ productId: 'p1', price: 100, quantity: 1 }],
    userId: 'u1',
    now: new Date('2026-09-08T00:00:00.000Z'),
  });

  assert.equal(result.discount, 25);
  assert.equal(result.totalPrice, 75);
  assert.deepEqual(discount.discount_user_used, []);
  assert.equal(discount.discount_max_use, 3);
});
