const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// SIGNUP

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "user already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let roleId = "PENDING";
    
    // Generate role-specific IDs
    if (role === "FARMER") {
      const lastUser = await User.findOne({ role: "FARMER", roleId: { $exists: true, $ne: "PENDING" } }).sort({ roleId: -1 });
      let nextNum = 1;
      if (lastUser && lastUser.roleId) {
        const match = lastUser.roleId.match(/S2S-FRM-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      roleId = `S2S-FRM-${String(nextNum).padStart(4, '0')}`;
    } else if (role === "PROCESSOR") {
      const lastUser = await User.findOne({ role: "PROCESSOR", roleId: { $exists: true, $ne: "PENDING" } }).sort({ roleId: -1 });
      let nextNum = 1;
      if (lastUser && lastUser.roleId) {
        const match = lastUser.roleId.match(/S2S-PRC-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      roleId = `S2S-PRC-${String(nextNum).padStart(4, '0')}`;
    } else if (role === "DISTRIBUTOR") {
      const lastUser = await User.findOne({ role: "DISTRIBUTOR", roleId: { $exists: true, $ne: "PENDING" } }).sort({ roleId: -1 });
      let nextNum = 1;
      if (lastUser && lastUser.roleId) {
        const match = lastUser.roleId.match(/S2S-DST-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      roleId = `S2S-DST-${String(nextNum).padStart(4, '0')}`;
    } else if (role === "RETAILER") {
      const lastUser = await User.findOne({ role: "RETAILER", roleId: { $exists: true, $ne: "PENDING" } }).sort({ roleId: -1 });
      let nextNum = 1;
      if (lastUser && lastUser.roleId) {
        const match = lastUser.roleId.match(/S2S-RET-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      roleId = `S2S-RET-${String(nextNum).padStart(4, '0')}`;
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      roleId
    });



    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '1d' }
    );

    return res.status(201).json({ 
      message: "User created successfully", 
      userId: user._id,
      token,
      user: { id: user._id, name: user.name, role: user.role, email: user.email, uniqueId: user.uniqueId }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// LOGIN

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "account not registered" });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return res.status(401).json({ message: "Invalid password credentials" });
    }


    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        uniqueId: user.uniqueId
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
