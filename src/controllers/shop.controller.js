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
