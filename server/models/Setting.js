const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['general', 'company', 'pdf', 'communication', 'sales', 'tax'],
    index: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingsSchema);
