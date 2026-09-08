'use strict';

const createDiscountError = (code) => {
  const error = new Error(code);
  error.code = code;
  return error;
};

const getUserUseCount = (discount, userId) =>
  (discount.discount_user_used ?? []).filter(
    (usedUserId) => String(usedUserId) === String(userId),
  ).length;

const getApplicableProducts = (discount, shopProducts) => {
  if (discount.discount_applies_to === 'all') return shopProducts;

  const productIds = new Set(
    (discount.discount_product_ids ?? []).map((productId) => String(productId)),
  );

  return shopProducts.filter(({ productId }) => productIds.has(String(productId)));
};

const isDiscountApplicableToProducts = ({ discount, productIds, userId, now = new Date() }) => {
  if (!discount.discount_is_active) return false;
  if (new Date(discount.discount_start_date) > now || new Date(discount.discount_end_date) < now) return false;
  if (Number(discount.discount_max_use) < 1) return false;

  const maxUsesPerUser = Number(discount.discount_max_uses_per_user ?? 0);
  if (maxUsesPerUser > 0 && getUserUseCount(discount, userId) >= maxUsesPerUser) return false;

  if (discount.discount_applies_to === 'all') return true;

  const allowedProductIds = new Set(
    (discount.discount_product_ids ?? []).map((productId) => String(productId)),
  );

  return productIds.some((productId) => allowedProductIds.has(String(productId)));
};

const getDiscountEligibility = ({ discount, shopProducts, userId, now = new Date() }) => {
  if (!discount.discount_is_active) throw createDiscountError('DISCOUNT_INACTIVE');

  const startDate = new Date(discount.discount_start_date);
  const endDate = new Date(discount.discount_end_date);
  if (startDate > now || endDate < now) throw createDiscountError('DISCOUNT_EXPIRED');

  if (discount.discount_max_use < 1) throw createDiscountError('DISCOUNT_DEPLETED');

  const maxUsesPerUser = Number(discount.discount_max_uses_per_user ?? 0);
  if (maxUsesPerUser > 0 && getUserUseCount(discount, userId) >= maxUsesPerUser) {
    throw createDiscountError('DISCOUNT_ALREADY_USED');
  }

  const applicableProducts = getApplicableProducts(discount, shopProducts);
  if (!applicableProducts.length) throw createDiscountError('DISCOUNT_NOT_APPLICABLE');

  const subtotal = applicableProducts.reduce(
    (total, { price, quantity }) => total + Number(price) * Number(quantity),
    0,
  );

  if (subtotal < Number(discount.discount_min_order_value ?? 0)) {
    throw createDiscountError('DISCOUNT_MINIMUM_NOT_MET');
  }

  const requestedDiscount = discount.discount_type === 'fix_amount'
    ? Number(discount.discount_value)
    : subtotal * (Number(discount.discount_value) / 100);
  const maxDiscount = Number(discount.discount_max_order_value ?? 0);
  const discountAmount = Math.min(
    subtotal,
    requestedDiscount,
    maxDiscount > 0 ? maxDiscount : Number.MAX_SAFE_INTEGER,
  );

  return {
    applicableProducts,
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
  };
};

module.exports = {
  createDiscountError,
  getDiscountEligibility,
  isDiscountApplicableToProducts,
};
