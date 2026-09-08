'use strict';

const asyncHandler = require('express-async-handler');
const userModel = require('../models/user.model');
const Shop = require('../models/shop.model');
const { ForbiddenError } = require('../core/error.responese');
const { hasRequiredRole } = require('./roles');

const requireRole = (...requiredRoles) => asyncHandler(async (req, res, next) => {
  const account = await userModel.findById(req.user.userId).select('name email roles').lean();
  if (!account || !hasRequiredRole(account.roles, requiredRoles)) {
    throw new ForbiddenError('You do not have permission for this action');
  }
  req.account = account;
  next();
});

const requireActiveShop = asyncHandler(async (req, res, next) => {
  const shop = await Shop.findOne({ ownerId: req.user.userId, status: 'active' });
  if (!shop) throw new ForbiddenError('Your shop is not active');
  req.shop = shop;
  next();
});

module.exports = { requireRole, requireActiveShop };
