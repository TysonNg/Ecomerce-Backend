'use strict';

const { SuccessResponse } = require('../core/success.response');
const ReviewService = require('../services/review.service');

class ReviewController {
  submitReview = async (req, res) => {
    new SuccessResponse({
      message: 'Review submitted successfully',
      metadata: await ReviewService.createOrUpdateReview({
        productId: req.body.productId,
        userId: req.user.userId,
        rating: req.body.rating,
        comment: req.body.comment,
      }),
    }).send(res);
  };

  getReviews = async (req, res) => {
    new SuccessResponse({
      message: 'Get reviews successfully',
      metadata: await ReviewService.getReviewsByProduct({
        productId: req.params.productId,
        page: req.query.page,
        limit: req.query.limit,
      }),
    }).send(res);
  };

  getUserReview = async (req, res) => {
    new SuccessResponse({
      message: 'Get user review successfully',
      metadata: await ReviewService.getUserReviewForProduct({
        productId: req.params.productId,
        userId: req.user.userId,
      }),
    }).send(res);
  };

  deleteReview = async (req, res) => {
    new SuccessResponse({
      message: 'Review deleted successfully',
      metadata: await ReviewService.deleteReview({
        reviewId: req.params.reviewId,
        userId: req.user.userId,
      }),
    }).send(res);
  };
}

module.exports = new ReviewController();
