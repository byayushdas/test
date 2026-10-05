const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET Profile
router.get('/:id', async (req, res) => {
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      user = await User.findById(req.params.id).select('-password');
    } else {
      user = await User.findOne({ roleId: req.params.id }).select('-password');
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.status(200).json({
      success: true,
      data: user.toObject()
    });
  } catch (error) {
    console.error("GET profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT Profile (Update)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    let user;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ roleId: userId });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sanitize: strip raw base64 data URLs (only keep proper https:// URLs or empty strings)
    // Raw base64 strings can reach several MB and cause MongoDB document size overflow
    const sanitizeImageField = (val) => {
      if (typeof val === 'string' && val.startsWith('data:')) return '';
      return val;
    };

    for (const key in updateData) {
      if (key !== '_id' && key !== 'role' && key !== 'email' && key !== 'uniqueId') {
        if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
          // Sanitize image fields inside nested objects
          const sanitized = { ...updateData[key] };
          for (const subKey in sanitized) {
            if (typeof sanitized[subKey] === 'string' && sanitized[subKey].startsWith('data:')) {
              sanitized[subKey] = '';
            }
          }
          let existingData = user.get(key) || {};
          if (typeof existingData.toObject === 'function') {
            existingData = existingData.toObject();
          }
          user.set(key, { ...existingData, ...sanitized });
          user.markModified(key); // Required: Mongoose won't detect nested object changes without this
        } else {
          // Sanitize top-level image fields
          user.set(key, typeof updateData[key] === 'string' ? sanitizeImageField(updateData[key]) : updateData[key]);
        }
      }
    }

    // Also clear any existing stored base64 blobs from the document itself
    if (user.profileImage && user.profileImage.startsWith('data:')) {
      user.profileImage = '';
      user.markModified('profileImage');
    }
    if (user.kycDetails) {
      let kycObj = user.kycDetails;
      if (typeof kycObj.toObject === 'function') kycObj = kycObj.toObject();
      let changed = false;
      if (kycObj.aadhaarFront && kycObj.aadhaarFront.startsWith('data:')) { kycObj.aadhaarFront = ''; changed = true; }
      if (kycObj.aadhaarBack && kycObj.aadhaarBack.startsWith('data:')) { kycObj.aadhaarBack = ''; changed = true; }
      if (changed) { user.set('kycDetails', kycObj); user.markModified('kycDetails'); }
    }

    user.updatedAt = Date.now();
    await user.save();

    return res.status(200).json({
      success: true,
      data: user.toObject()
    });
  } catch (error) {
    console.error("PUT profile error:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      detail: error.message,
      errorType: error.name
    });
  }
});

module.exports = router;
