const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// GET Profile
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    let user;
    
    // Check if it's a cuid/uuid vs roleId
    if (id.startsWith('cuid') || id.length > 20) {
      user = await prisma.user.findUnique({
        where: { id },
        include: { farmerProfile: true, processorProfile: true, distributorProfile: true, retailerProfile: true, kycDetails: true, bankDetails: true }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { roleId: id },
        include: { farmerProfile: true, processorProfile: true, distributorProfile: true, retailerProfile: true, kycDetails: true, bankDetails: true }
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Omit password
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    return next(error);
  }
});

// PUT Profile (Update)
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    
    let user;
    if (id.startsWith('cuid') || id.length > 20) {
      user = await prisma.user.findUnique({ where: { id } });
    } else {
      user = await prisma.user.findUnique({ where: { roleId: id } });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sanitizeImageField = (val) => {
      if (typeof val === 'string' && val.startsWith('data:')) return '';
      return val;
    };

    // Prepare update payload
    const userUpdate = {};
    const profileUpdate = {};
    const kycUpdate = {};
    const bankUpdate = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (['id', 'role', 'email', 'uniqueId', 'password'].includes(key)) continue;

      if (key === 'kycDetails' && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
          kycUpdate[k] = typeof v === 'string' ? sanitizeImageField(v) : v;
        }
      } else if (key === 'bankDetails' && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
          bankUpdate[k] = typeof v === 'string' ? sanitizeImageField(v) : v;
        }
      } else if (key === 'farmerProfile' || key === 'farmDetails') {
        for (const [k, v] of Object.entries(value)) {
          profileUpdate[k] = typeof v === 'string' ? sanitizeImageField(v) : v;
        }
      } else {
        userUpdate[key] = typeof value === 'string' ? sanitizeImageField(value) : value;
      }
    }

    // Force clear base64 from db
    if (userUpdate.profileImage && userUpdate.profileImage.startsWith('data:')) {
      userUpdate.profileImage = '';
    }

    const transactionTasks = [];

    // Update base user
    transactionTasks.push(
      prisma.user.update({
        where: { id: user.id },
        data: userUpdate
      })
    );

    // Update specific profile
    if (Object.keys(profileUpdate).length > 0) {
      if (user.role === 'FARMER') {
        transactionTasks.push(prisma.farmerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...profileUpdate },
          update: profileUpdate
        }));
      } else if (user.role === 'PROCESSOR') {
        transactionTasks.push(prisma.processorProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...profileUpdate },
          update: profileUpdate
        }));
      } else if (user.role === 'DISTRIBUTOR') {
        transactionTasks.push(prisma.distributorProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...profileUpdate },
          update: profileUpdate
        }));
      } else if (user.role === 'RETAILER') {
        transactionTasks.push(prisma.retailerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...profileUpdate },
          update: profileUpdate
        }));
      }
    }

    if (Object.keys(kycUpdate).length > 0) {
      transactionTasks.push(prisma.userKyc.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...kycUpdate },
        update: kycUpdate
      }));
    }

    if (Object.keys(bankUpdate).length > 0) {
      transactionTasks.push(prisma.userBankDetails.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...bankUpdate },
        update: bankUpdate
      }));
    }

    await prisma.$transaction(transactionTasks);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, processorProfile: true, distributorProfile: true, retailerProfile: true, kycDetails: true, bankDetails: true }
    });

    const { password: _p, ...safeUser } = updatedUser;

    return res.status(200).json({
      success: true,
      data: safeUser
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
