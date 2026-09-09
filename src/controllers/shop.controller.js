'use strict';

const mongoose = require('mongoose');
const Shop = require('../models/shop.model');
const userModel = require('../models/user.model');
const { CREATED, OK } = require('../core/success.response');
const { BadRequestError, ConflictRequestError, NotFoundError } = require('../core/error.responese');
const { createShopPayload } = require('../services/shop-lifecycle.service');
const { buildShopReview } = require('../services/shop-approval.service');

class ShopController {
  createShop = async (req, res) => {
    const { name, logo = '', description = '' } = req.body;
    if (!name || !name.trim()) throw new BadRequestError('Shop name is required');

    const existingShop = await Shop.findOne({ ownerId: req.user.userId });
    if (existingShop) throw new ConflictRequestError('An account can own only one shop');

    let shop;
    try {
      shop = await Shop.create(createShopPayload({
        ownerId: req.user.userId,
        name: name.trim(),
        logo,
        description,
      }));
    } catch (error) {
      if (error.code === 11000) throw new ConflictRequestError('Shop name or ownership already exists');
      throw error;
    }

    new CREATED({ message: 'Shop registration submitted', metadata: shop }).send(res);
  };

  getMyShop = async (req, res) => {
    const shop = await Shop.findOne({ ownerId: req.user.userId }).lean();
    new OK({ message: 'Get current shop success', metadata: shop }).send(res);
  };

  getPublicShopDetail = async (req, res) => {
    const { idOrSlug } = req.params;
    if (!idOrSlug) throw new BadRequestError('Shop identifier is required');

    const isId = mongoose.isObjectIdOrHexString(idOrSlug);
    const filter = isId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
    const shop = await Shop.findOne({ ...filter, status: 'active' }).select('_id name slug logo description createdAt').lean();
    if (!shop) throw new NotFoundError('Shop not found or inactive');

    const { product } = require('../models/product.model');
    const productCount = await product.countDocuments({ product_shop: shop._id, isPublished: true });

    new OK({
      message: 'Get public shop details success',
      metadata: { ...shop, productCount },
    }).send(res);
  };

  getAllPublicShops = async (req, res) => {
    const { product } = require('../models/product.model');
    const shops = await Shop.find({ status: 'active' })
      .select('_id name slug logo description createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const enhancedShops = await Promise.all(
      shops.map(async (shop) => {
        const [productCount, sampleProducts] = await Promise.all([
          product.countDocuments({ product_shop: shop._id, isPublished: true }),
          product.find({ product_shop: shop._id, isPublished: true })
            .select('_id product_name product_thumb product_slug product_price')
            .limit(4)
            .lean(),
        ]);
        return {
          ...shop,
          productCount,
          sampleProducts,
        };
      })
    );

    new OK({
      message: 'Get all public shops success',
      metadata: enhancedShops,
    }).send(res);
  };

  reviewShop = (action) => async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.shopId)) throw new BadRequestError('Invalid shop ID', 400);
    const session = await mongoose.startSession();
    let reviewedShop;

    try {
      await session.withTransaction(async () => {
        const shop = await Shop.findById(req.params.shopId).session(session);
        if (!shop) throw new NotFoundError('Shop not found');

        const owner = await userModel.findById(shop.ownerId).session(session);
        if (!owner) throw new NotFoundError('Shop owner not found');

        const review = buildShopReview({
            shop,
            ownerRoles: owner.roles,
            action,
            reviewerId: req.user.userId,
            reason: req.body.reason,
          });

        shop.set(review.shopUpdate);
        owner.roles = review.ownerRoles;
        await shop.save({ session });
        if (action === 'approve') await owner.save({ session });
        reviewedShop = shop;
      });
    } finally {
      await session.endSession();
    }

    new OK({
      message: action === 'approve' ? 'Shop approved' : 'Shop rejected',
      metadata: reviewedShop,
    }).send(res);
  };
}

module.exports = new ShopController();
