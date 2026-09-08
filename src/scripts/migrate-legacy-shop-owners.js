'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('../models/shop.model');
const userModel = require('../models/user.model');
const { product } = require('../models/product.model');
const discountModel = require('../models/discount.model');
const { collectLegacyOwnerIds, createLegacyShopPayload } = require('../services/legacy-shop-migration.service');

const isDryRun = process.argv.includes('--dry-run');

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);

  const [productOwnerIds, discountOwnerIds, shops] = await Promise.all([
    product.distinct('product_shop', { product_shop: { $ne: null } }),
    discountModel.distinct('discount_shopId', { discount_shopId: { $ne: null } }),
    Shop.find({}).select('_id').lean(),
  ]);
  const ownerIds = collectLegacyOwnerIds({
    productOwnerIds,
    discountOwnerIds,
    shopIds: shops.map((shop) => shop._id),
  });

  if (isDryRun) {
    console.log(JSON.stringify({ legacyOwners: ownerIds.length, productOwners: productOwnerIds.length, discountOwners: discountOwnerIds.length }));
    return;
  }

  for (const ownerId of ownerIds) {
    let shop = await Shop.findOne({ ownerId });
    if (!shop) shop = await Shop.create(createLegacyShopPayload(ownerId));

    await Promise.all([
      product.updateMany({ product_shop: ownerId }, { $set: { product_shop: shop._id } }),
      discountModel.updateMany({ discount_shopId: ownerId }, { $set: { discount_shopId: shop._id } }),
      userModel.updateOne({ _id: ownerId }, { $addToSet: { roles: 'SHOP' } }),
    ]);
  }

  console.log(JSON.stringify({ migratedOwners: ownerIds.length }));
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
