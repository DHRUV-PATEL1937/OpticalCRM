const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      maxlength: 15,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    dateOfBirth: {
      type: Date,
    },
    anniversary: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    category: {
      type: String,
      enum: ['regular', 'premium', 'vip'],
      default: 'regular',
    },
    labels: {
      type: [String],
      default: [],
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastVisit: {
      type: Date,
    },
    branch: {
      type: String,
      default: 'main',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
customerSchema.index({ name: 'text', phone: 'text', email: 'text' });
customerSchema.index({ phone: 1 });
customerSchema.index({ category: 1 });
customerSchema.index({ dateOfBirth: 1 });
customerSchema.index({ branch: 1 });

module.exports = mongoose.model('Customer', customerSchema);
