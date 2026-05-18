const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Message = require('../models/Message');
const { protect, authorize } = require('../middleware/auth');
const { addToMessageQueue } = require('../services/queueService');

const upload = multer({ storage: multer.memoryStorage() });

// Upload Excel for Bulk Messaging
router.post('/upload', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { templateName } = req.body;
    if (!templateName) return res.status(400).json({ message: 'Template name is required' });

    // Parse Excel
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let queuedCount = 0;

    // Validate and store
    for (const row of data) {
      // Expecting columns 'Phone' and optionally 'Name'
      const phone = row.Phone || row.phone || row.PhoneNumber;
      const name = row.Name || row.name || row.CustomerName || 'Valued Customer';

      if (!phone) continue;

      const message = new Message({
        phoneNumber: String(phone).replace(/\D/g, ''),
        customerName: name,
        templateName,
        status: 'queued'
      });
      await message.save();

      const components = [
        { type: 'body', parameters: [{ type: 'text', text: name }] }
      ];

      // Add to Redis Queue
      await addToMessageQueue(message.phoneNumber, templateName, components);
      queuedCount++;
    }

    res.json({ success: true, message: `Successfully queued ${queuedCount} messages for processing` });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Failed to process excel file' });
  }
});

// Get recent messages status
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await Message.find().sort('-createdAt').limit(limit);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

module.exports = router;
