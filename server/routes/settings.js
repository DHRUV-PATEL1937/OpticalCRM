const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');

// Get all settings
router.get('/', protect, async (req, res) => {
  try {
    const settings = await Setting.find({});
    // Format into a key-value object grouped by category
    const formattedSettings = settings.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = {};
      acc[curr.category][curr.key] = curr.value;
      return acc;
    }, {});
    
    res.json({ success: true, data: formattedSettings });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { settings } = req.body; // Array of { category, key, value }
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings must be an array' });
    }

    const updatePromises = settings.map(setting => 
      Setting.findOneAndUpdate(
        { key: setting.key },
        { 
          category: setting.category,
          key: setting.key,
          value: setting.value 
        },
        { upsert: true, new: true }
      )
    );

    await Promise.all(updatePromises);
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Settings Update Error:', err);
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

module.exports = router;
