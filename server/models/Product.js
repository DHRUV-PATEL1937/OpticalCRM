const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['frames', 'sunglasses', 'lenses', 'contact_lenses', 'solutions', 'accessories'],
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    size: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      trim: true,
      default: '',
      // e.g., 'full-rim', 'half-rim', 'rimless' for frames
    },
    material: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex', 'kids', ''],
      default: 'unisex',
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    mrp: {
      type: Number,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      default: 18, // GST percentage
      min: 0,
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    branch: {
      type: String,
      default: 'main',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
productSchema.index({ name: 'text', brand: 'text', sku: 'text', barcode: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ stockQuantity: 1 });
productSchema.index({ branch: 1 });

// Auto-generate SKU before saving
productSchema.pre('save', async function (next) {
  if (!this.sku) {
    const categoryPrefix = {
      frames: 'FRM',
      sunglasses: 'SNG',
      lenses: 'LNS',
      contact_lenses: 'CLN',
      solutions: 'SOL',
      accessories: 'ACC',
    };
    const prefix = categoryPrefix[this.category] || 'PRD';
    const count = await mongoose.model('Product').countDocuments();
    this.sku = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
