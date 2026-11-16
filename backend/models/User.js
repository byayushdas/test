const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['FARMER', 'PROCESSOR', 'DISTRIBUTOR', 'RETAILER'],
    index: true
  },
  roleId: { type: String, index: true },

  // Shared profile fields
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  profileImage: { type: String },
  reviews: [{
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],


  // Farmer Fields
  farmDetails: {
    farmName: { type: String },
    farmLocation: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    totalLandArea: { type: String },
    mainCultivatedCrops: { type: [String] },
    farmingPractice: { type: String }
  },

  // Processor Fields
  processorDetails: {
    facilityName: { type: String },
    facilityLocation: { type: String },
    processingCapacity: { type: String },
    mainProcessedProducts: { type: String },
    complianceStandards: { type: String }
  },

  // Distributor Fields
  distributorDetails: {
    companyName: { type: String },
    location: { type: String },
    storageCapacity: { type: String },
    operatingFacilities: { type: String },
    transportFleet: { type: String }
  },

  // Retailer Fields
  retailerDetails: {
    storeName: { type: String },
    storeLocation: { type: String },
    shelfCapacity: { type: String },
    storeTypeFocus: { type: String },
    employeeCount: { type: String }
  },

  // KYC Details
  kycDetails: {
    aadhaarNumber: { type: String },
    aadhaarFront: { type: String },
    aadhaarFrontPublicId: { type: String },
    aadhaarBack: { type: String },
    aadhaarBackPublicId: { type: String },
    submitKyc: { type: Boolean, default: false },
    kycStatus: { type: String, default: "Pending Verification" },
    rejectionReason: { type: String },
    verificationDate: { type: Date }
  },

  // Bank Account Details
  bankDetails: {
    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branchLocation: { type: String }
  },

  regDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });

module.exports = mongoose.model('User', userSchema);
