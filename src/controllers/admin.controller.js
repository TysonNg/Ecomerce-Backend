'use strict';

const { OK } = require('../core/success.response');
const { BadRequestError, NotFoundError } = require('../core/error.responese');
const Shop = require('../models/shop.model');
const { parseShopQuery } = require('../services/admin-shop-query.service');
const { isObjectIdOrHexString } = require('mongoose');

const shopFields = 'name slug logo description status ownerId reviewedBy reviewedAt rejectionReason createdAt updatedAt';
const withPeople = (query) => query.select(shopFields)
  .populate('ownerId', 'name email').populate('reviewedBy', 'name email');

exports.me = async (req, res) => {
  new OK({ metadata: req.account }).send(res);
};

exports.summary = async (req, res) => {
  const counts = await Shop.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const summary = { total: 0, pending: 0, active: 0, rejected: 0 };
  for (const entry of counts) {
    if (['pending', 'active', 'rejected'].includes(entry._id)) summary[entry._id] = entry.count;
    summary.total += entry.count;
  }
  new OK({ metadata: summary }).send(res);
};

exports.list = async (req, res) => {
  const { filter, page, limit } = parseShopQuery(req.query);
  const [items, total] = await Promise.all([
    withPeople(Shop.find(filter)).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Shop.countDocuments(filter),
  ]);
  new OK({ metadata: { items, total, page, limit, totalPages: Math.ceil(total / limit) } }).send(res);
};

exports.detail = async (req, res) => {
  if (!isObjectIdOrHexString(req.params.shopId)) throw new BadRequestError('Invalid shop ID', 400);
  const shop = await withPeople(Shop.findById(req.params.shopId)).lean();
  if (!shop) throw new NotFoundError('Shop not found');
  new OK({ metadata: shop }).send(res);
};
