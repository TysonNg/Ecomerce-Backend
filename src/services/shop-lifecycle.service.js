'use strict';

const slugify = require('slugify');

const canTransitionShop = ({ from, to }) =>
  from === 'pending' && (to === 'active' || to === 'rejected');

const createShopPayload = ({ ownerId, name, logo = '', description = '' }) => ({
  ownerId,
  name,
  slug: slugify(name, { lower: true, strict: true }),
  logo,
  description,
  status: 'pending',
});

module.exports = { canTransitionShop, createShopPayload };
