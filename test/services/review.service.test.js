'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const ReviewService = require('../../src/services/review.service');

test('calculateRatingStats correctly computes total, average, and star breakdown', () => {
  const ratings = [5, 5, 4, 3, 5, 1];
  const stats = ReviewService.calculateRatingStats(ratings);

  assert.equal(stats.total, 6);
  // (5 + 5 + 4 + 3 + 5 + 1) / 6 = 23 / 6 = 3.833... -> 3.8
  assert.equal(stats.avg, 3.8);
  assert.deepEqual(stats.distribution, {
    1: 1,
    2: 0,
    3: 1,
    4: 1,
    5: 3,
  });
});

test('calculateRatingStats handles empty ratings', () => {
  const stats = ReviewService.calculateRatingStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.avg, 0);
  assert.deepEqual(stats.distribution, {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
});

test('validateReviewInput passes for valid input', () => {
  const validProductId = new mongoose.Types.ObjectId().toString();
  const validUserId = new mongoose.Types.ObjectId().toString();

  const validated = ReviewService.validateReviewInput({
    productId: validProductId,
    userId: validUserId,
    rating: '5',
    comment: '   Great sound quality!  ',
  });

  assert.equal(validated.productId, validProductId);
  assert.equal(validated.userId, validUserId);
  assert.equal(validated.rating, 5);
  assert.equal(validated.comment, 'Great sound quality!');
});

test('validateReviewInput rejects rating outside 1-5 or non-integer', () => {
  const validProductId = new mongoose.Types.ObjectId().toString();
  const validUserId = new mongoose.Types.ObjectId().toString();

  assert.throws(
    () => ReviewService.validateReviewInput({
      productId: validProductId,
      userId: validUserId,
      rating: 0,
      comment: 'Bad',
    }),
    { status: 403, message: 'Rating must be an integer between 1 and 5' }
  );

  assert.throws(
    () => ReviewService.validateReviewInput({
      productId: validProductId,
      userId: validUserId,
      rating: 6,
      comment: 'Super',
    }),
    { status: 403, message: 'Rating must be an integer between 1 and 5' }
  );

  assert.throws(
    () => ReviewService.validateReviewInput({
      productId: validProductId,
      userId: validUserId,
      rating: 3.5,
      comment: 'Decent',
    }),
    { status: 403, message: 'Rating must be an integer between 1 and 5' }
  );
});

test('validateReviewInput rejects empty or whitespace-only comment', () => {
  const validProductId = new mongoose.Types.ObjectId().toString();
  const validUserId = new mongoose.Types.ObjectId().toString();

  assert.throws(
    () => ReviewService.validateReviewInput({
      productId: validProductId,
      userId: validUserId,
      rating: 5,
      comment: '   ',
    }),
    { status: 403, message: 'Review comment cannot be empty' }
  );
});

test('validateReviewInput rejects invalid object IDs', () => {
  assert.throws(
    () => ReviewService.validateReviewInput({
      productId: 'invalid-prod-id',
      userId: new mongoose.Types.ObjectId().toString(),
      rating: 5,
      comment: 'Good',
    }),
    { status: 403, message: 'Invalid product ID' }
  );

  assert.throws(
    () => ReviewService.validateReviewInput({
      productId: new mongoose.Types.ObjectId().toString(),
      userId: 'invalid-user-id',
      rating: 5,
      comment: 'Good',
    }),
    { status: 403, message: 'Invalid user ID' }
  );
});
