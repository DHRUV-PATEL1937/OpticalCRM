const mongoose = require('mongoose');

const eyeDataSchema = new mongoose.Schema({
  sph: { type: String, default: '' }, // Sphere (e.g., +1.00, -2.50)
  cyl: { type: String, default: '' }, // Cylinder
  axis: { type: String, default: '' }, // Axis (0-180)
  add: { type: String, default: '' },  // Addition
  va: { type: String, default: '' },   // Visual Acuity (e.g., 6/6)
}, { _id: false });

const prescriptionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    rightEye: {
      type: eyeDataSchema,
      default: () => ({}),
    },
    leftEye: {
      type: eyeDataSchema,
      default: () => ({}),
    },
    pd: {
      type: String, // Pupillary Distance
      default: '',
    },
    doctorName: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    validUntil: {
      type: Date,
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
prescriptionSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
