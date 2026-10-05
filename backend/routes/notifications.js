const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/v1/notifications?userId=
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const notifs = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);
    return res.json({ success: true, data: notifs });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    return res.json({ success: true, data: notif });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/v1/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
