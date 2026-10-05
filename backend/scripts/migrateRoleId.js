require('dotenv').config();
const mongoose = require('mongoose');
const RoleInfo = require('../models/RoleInfo');

async function migrateRoleIdToIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/seed2shelf");
    console.log("Connected to DB");

    const roleInfos = await mongoose.connection.db.collection('roleinfos').find({}).toArray();
    console.log(`Found ${roleInfos.length} RoleInfo documents.`);

    for (const info of roleInfos) {
      if (typeof info._id === 'string' && info._id === info.roleId) {
        // Already migrated
        continue;
      }
      
      const newId = info.roleId || `PENDING_${Date.now()}_${Math.random()}`;
      
      // We can't update _id, so we must insert a new document and delete the old one.
      const newDoc = { ...info, _id: newId };
      
      await mongoose.connection.db.collection('roleinfos').deleteOne({ _id: info._id });
      await mongoose.connection.db.collection('roleinfos').insertOne(newDoc);
      
      console.log(`Migrated ${info.email}: replaced _id ${info._id} with ${newId}`);
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrateRoleIdToIndex();
