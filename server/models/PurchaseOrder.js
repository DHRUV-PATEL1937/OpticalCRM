const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  requestedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  receivedQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    items: {
      type: [poItemSchema],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedDate: {
      type: Date,
    },
    notes: {
      type: String,
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
  { timestamps: true }
);

purchaseOrderSchema.pre('save', async function (next) {
  if (!this.poNumber) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.poNumber = `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
