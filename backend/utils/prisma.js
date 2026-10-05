const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Supabase PostgreSQL strictly requires SSL. We dynamically inject it
// if the connection string points to Supabase or we're in production.
const isSupabase = connectionString && connectionString.includes('supabase');
const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({ 
  connectionString,
  ...((isSupabase || isProd) && {
    ssl: { rejectUnauthorized: false } // Required for Supabase standard deployments
  })
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
