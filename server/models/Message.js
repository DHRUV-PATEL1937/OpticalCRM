const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true
  },
  customerName: {
    type: String
  },
  templateName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'sent', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String
  },
  sentAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
