'use strict';

const { Schema, model } = require('mongoose');

const shopSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '', maxlength: 500 },
}, { timestamps: true, collection: 'Shops' });

module.exports = model('Shop', shopSchema);
