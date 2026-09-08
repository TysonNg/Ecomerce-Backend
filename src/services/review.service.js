'use strict';

const mongoose = require('mongoose');
const reviewModel = require('../models/review.model');
const { product: productModel } = require('../models/product.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.responese');

class ReviewService {
  /**
   * Calculate aggregated rating stats from an array of ratings
   */
  static calculateRatingStats(ratings = []) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!ratings || ratings.length === 0) {
      return { total: 0, avg: 0, distribution };
    }
    let sum = 0;
    let validCount = 0;
    for (const r of ratings) {
      const num = Number(r);
      if (distribution[num] !== undefined) {
        distribution[num] += 1;
        sum += num;
        validCount += 1;
      }
    }
    const avg = validCount > 0 ? Math.round((sum / validCount) * 10) / 10 : 0;
    return { total: validCount, avg, distribution };
  }

  /**
   * Validate review input payload
   */
  static validateReviewInput({ productId, userId, rating, comment }) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new BadRequestError('Invalid product ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5');
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      throw new BadRequestError('Review comment cannot be empty');
    }

    return {
      productId,
      userId,
      rating: numericRating,
      comment: comment.trim(),
    };
  }

  /**
   * Recalculate average rating and total review counts for a product
   */
  static async recalculateProductRating(productId) {
    const pId = new mongoose.Types.ObjectId(productId);
    const stats = await reviewModel.aggregate([
      { $match: { productId: pId } },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    let avg = 5;
    let total = 0;
    if (stats.length > 0) {
      avg = Math.round(stats[0].avgRating * 10) / 10;
      total = stats[0].totalReviews;
    }

    await productModel.findByIdAndUpdate(productId, {
      product_ratingsAvenrage: avg,
      product_ratingsAverage: avg,
      product_reviewsCount: total,
    });

    return { avg, total };
  }

  /**
   * Create or update a review for a product by a user
   */
  static async createOrUpdateReview({ productId, userId, rating, comment }) {
    const validated = ReviewService.validateReviewInput({ productId, userId, rating, comment });

    const existingProduct = await productModel.findById(validated.productId);
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    const review = await reviewModel
      .findOneAndUpdate(
        { productId: validated.productId, userId: validated.userId },
        { rating: validated.rating, comment: validated.comment },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      .populate('userId', 'name email');

    await ReviewService.recalculateProductRating(validated.productId);

    return { review };
  }

  /**
   * Get paginated reviews and aggregated statistics for a product
   */
  static async getReviewsByProduct({ productId, page = 1, limit = 10 }) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new BadRequestError('Invalid product ID');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total, distributionRaw] = await Promise.all([
      reviewModel
        .find({ productId })
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reviewModel.countDocuments({ productId }),
      reviewModel.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRating = 0;
    distributionRaw.forEach((item) => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
      }
      sumRating += item._id * item.count;
    });

    const avgRating = total > 0 ? Math.round((sumRating / total) * 10) / 10 : 0;

    return {
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      stats: {
        avgRating,
        totalReviews: total,
        distribution,
      },
    };
  }

  /**
   * Get review submitted by current user for a specific product
   */
  static async getUserReviewForProduct({ productId, userId }) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new BadRequestError('Invalid product ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    const review = await reviewModel
      .findOne({ productId, userId })
      .populate('userId', 'name email')
      .lean();

    return { review: review || null };
  }

  /**
   * Delete a review by review ID (only author can delete)
   */
  static async deleteReview({ reviewId, userId }) {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestError('Invalid review ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    const review = await reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (String(review.userId) !== String(userId)) {
      throw new ForbiddenError('You can only delete your own review');
    }

    const productId = review.productId;
    await reviewModel.findByIdAndDelete(reviewId);
    await ReviewService.recalculateProductRating(productId);

    return { success: true };
  }
}

module.exports = ReviewService;
