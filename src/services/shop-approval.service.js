'use strict';

const { canTransitionShop } = require('./shop-lifecycle.service');
const { mergeRoles } = require('../auth/roles');
const { BadRequestError, ConflictRequestError } = require('../core/error.responese');

const buildShopReview = ({ shop, ownerRoles, action, reviewerId, reason, reviewedAt = new Date() }) => {
  const nextStatus = action === 'approve' ? 'active' : action === 'reject' ? 'rejected' : null;
  if (!nextStatus || !canTransitionShop({ from: shop.status, to: nextStatus })) {
    throw new ConflictRequestError('Only pending shops can be reviewed');
  }
  if (action === 'reject' && (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 500)) {
    throw new BadRequestError('Rejection reason must contain 1–500 characters', 400);
  }

  return {
    shopUpdate: { status: nextStatus, reviewedBy: reviewerId, reviewedAt, rejectionReason: action === 'reject' ? reason.trim() : '' },
    ownerRoles: nextStatus === 'active' ? mergeRoles(ownerRoles, 'SHOP') : ownerRoles,
  };
};

module.exports = { buildShopReview };
