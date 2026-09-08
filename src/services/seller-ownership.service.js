'use strict';

const buildShopOwnedProductQuery = ({ productId, shopId }) => ({
  _id: productId,
  product_shop: shopId,
});

const isOwnedByShop = (product, shopId) =>
  Boolean(product) && String(product.product_shop) === String(shopId);

module.exports = { buildShopOwnedProductQuery, isOwnedByShop };
