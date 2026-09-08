'use strict';

const { BadRequestError } = require('../core/error.responese');

const parseShopQuery = ({ q = '', status = 'pending', page = '1', limit = '20' } = {}) => {
  if (typeof q !== 'string' || q.length > 200 || !['all', 'pending', 'active', 'rejected'].includes(status)) {
    throw new BadRequestError('Invalid shop filter', 400);
  }
  const isPositiveInteger = (value) => ['string', 'number'].includes(typeof value) &&
    /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  if (!isPositiveInteger(page) || !isPositiveInteger(limit)) {
    throw new BadRequestError('Invalid pagination', 400);
  }
  const pageNumber = Number(page);
  const pageSize = Math.min(Number(limit), 100);
  if (!Number.isSafeInteger((pageNumber - 1) * pageSize)) {
    throw new BadRequestError('Invalid pagination', 400);
  }
  const filter = status === 'all' ? {} : { status };
  if (q.trim()) filter.name = { $regex: q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  return { filter, page: pageNumber, limit: pageSize };
};

module.exports = { parseShopQuery };
