'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');
const { authentication } = require('../../auth/checkAuth');
const shopController = require('../../controllers/shop.controller');

const router = express.Router();

router.use(authentication);
router.post('', asyncHandler(shopController.createShop));
router.get('/me', asyncHandler(shopController.getMyShop));

module.exports = router;
