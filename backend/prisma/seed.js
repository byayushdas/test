const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUsers = [
    {
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'ADMIN',
      uniqueId: 'S2S-ADM-0001'
    },
    {
      email: 'farmer@demo.com',
      name: 'Demo Farmer',
      role: 'FARMER',
      uniqueId: 'S2S-FRM-0001',
      profile: {
        farmName: 'Demo Farm',
        farmLocation: 'Punjab, India',
        mainCultivatedCrops: ['Wheat', 'Rice']
      }
    },
    {
      email: 'processor@demo.com',
      name: 'Demo Processor',
      role: 'PROCESSOR',
      uniqueId: 'S2S-PRC-0001',
      profile: {
        facilityName: 'Demo Processing Unit',
        facilityLocation: 'Haryana, India'
      }
    },
    {
      email: 'distributor@demo.com',
      name: 'Demo Distributor',
      role: 'DISTRIBUTOR',
      uniqueId: 'S2S-DST-0001',
      profile: {
        companyName: 'Demo Logistics',
        location: 'Delhi, India'
      }
    },
    {
      email: 'retailer@demo.com',
      name: 'Demo Retailer',
      role: 'RETAILER',
      uniqueId: 'S2S-RET-0001',
      profile: {
        storeName: 'Demo Store',
        storeLocation: 'Mumbai, India'
      }
    }
  ];

  for (const u of demoUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email }
    });

    if (!existing) {
      const createdUser = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          password: passwordHash,
          uniqueId: u.uniqueId,
        }
      });
      console.log(`Created user: ${u.email}`);

      // Create profile based on role
      if (u.role === 'FARMER') {
        await prisma.farmerProfile.create({
          data: {
            userId: createdUser.id,
            farmName: u.profile.farmName,
            farmLocation: u.profile.farmLocation,
            mainCultivatedCrops: u.profile.mainCultivatedCrops
          }
        });
      } else if (u.role === 'PROCESSOR') {
        await prisma.processorProfile.create({
          data: {
            userId: createdUser.id,
            facilityName: u.profile.facilityName,
            facilityLocation: u.profile.facilityLocation
          }
        });
      } else if (u.role === 'DISTRIBUTOR') {
        await prisma.distributorProfile.create({
          data: {
            userId: createdUser.id,
            companyName: u.profile.companyName,
            location: u.profile.location
          }
        });
      } else if (u.role === 'RETAILER') {
        await prisma.retailerProfile.create({
          data: {
            userId: createdUser.id,
            storeName: u.profile.storeName,
            storeLocation: u.profile.storeLocation
          }
        });
      }
    } else {
      console.log(`User ${u.email} already exists. Skipping.`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
