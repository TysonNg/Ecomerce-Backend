'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');
const { authentication } = require('../../auth/checkAuth');
const { requireRole } = require('../../auth/requireRole');
const shopController = require('../../controllers/shop.controller');
const adminController = require('../../controllers/admin.controller');

const router = express.Router();

router.use(authentication, requireRole('ADMIN'));
router.get('/me', asyncHandler(adminController.me));
router.get('/shops/summary', asyncHandler(adminController.summary));
router.get('/shops', asyncHandler(adminController.list));
router.get('/shops/:shopId', asyncHandler(adminController.detail));
router.patch('/shops/:shopId/approve', asyncHandler(shopController.reviewShop('approve')));
router.patch('/shops/:shopId/reject', asyncHandler(shopController.reviewShop('reject')));

module.exports = router;
