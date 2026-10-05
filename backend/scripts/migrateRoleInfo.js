require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const RoleInfo = require('../models/RoleInfo');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/seed2shelf");
    console.log("Connected to MongoDB.");

    const users = await User.find({ profileDetails: { $exists: true, $ne: {} } });
    console.log(`Found ${users.length} users with profileDetails.`);

    let migratedCount = 0;

    for (const user of users) {
      // Find the ID field for this role
      let roleId = "PENDING";
      const pd = user.profileDetails || {};
      
      if (user.role === 'FARMER' && pd.farmerId) roleId = pd.farmerId;
      else if (user.role === 'PROCESSOR' && pd.processorId) roleId = pd.processorId;
      else if (user.role === 'DISTRIBUTOR' && pd.distributorId) roleId = pd.distributorId;
      else if (user.role === 'RETAILER' && pd.retailerId) roleId = pd.retailerId;

      const existingRoleInfo = await RoleInfo.findOne({ email: user.email });
      if (!existingRoleInfo) {
        await RoleInfo.create({
          email: user.email,
          role: user.role,
          roleId: roleId,
          ...pd // Spread the rest of profileDetails into RoleInfo (schema throws away unknown fields unless Mixed)
        });
        migratedCount++;
        console.log(`Migrated user: ${user.email} with roleId: ${roleId}`);
      }
    }

    console.log(`Migration complete. Migrated ${migratedCount} new records.`);

    // Wait, do we remove profileDetails from User collection now?
    // Let's remove it to keep User clean.
    await User.updateMany({}, { $unset: { profileDetails: "" } });
    console.log("Unset profileDetails from all User documents.");

    mongoose.connection.close();
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();
