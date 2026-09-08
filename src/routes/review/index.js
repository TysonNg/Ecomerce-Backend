'use strict';

const express = require('express');
const asyncHandler = require('express-async-handler');
const reviewController = require('../../controllers/review.controller');
const { authentication } = require('../../auth/checkAuth');

const router = express.Router();

// Public: Get reviews & statistics for a product
router.get('/product/:productId', asyncHandler(reviewController.getReviews));

// Protected routes (require user login)
router.use(authentication);

router.get('/product/:productId/me', asyncHandler(reviewController.getUserReview));
router.post(['', '/'], asyncHandler(reviewController.submitReview));
router.delete('/:reviewId', asyncHandler(reviewController.deleteReview));

module.exports = router;
