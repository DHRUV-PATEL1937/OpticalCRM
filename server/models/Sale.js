const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productSku: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  // Lens-specific fields for prescription combos
  prescriptionDetails: {
    rightEye: {
      sph: { type: String, default: '' },
      cyl: { type: String, default: '' },
      axis: { type: String, default: '' },
      add: { type: String, default: '' },
      va: { type: String, default: '' },
    },
    leftEye: {
      sph: { type: String, default: '' },
      cyl: { type: String, default: '' },
      axis: { type: String, default: '' },
      add: { type: String, default: '' },
      va: { type: String, default: '' },
    },
    pd: { type: String, default: '' }
  },
  glassDetails: {
    name: { type: String, default: '' },
    price: { type: Number, default: 0 }
  },
});

const paymentDetailSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reference: {
    type: String,
    default: '',
  },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one item is required',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'mixed', 'bank_transfer'],
      default: 'cash',
    },
    paymentDetails: {
      type: [paymentDetailSchema],
      default: [],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'returned', 'partially_returned'],
      default: 'completed',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

// Indexes
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ branch: 1, createdAt: -1 });

// Auto-generate invoice number
saleSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const count = await mongoose.model('Sale').countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      },
    });
    this.invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
