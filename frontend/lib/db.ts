import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = "mongodb+srv://ayushdas20241_db_user:WBkwqMWEiyRp82Yy@cluster0.jjsco4e.mongodb.net/?appName=Cluster0";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('Frontend connected to MongoDB Atlas');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error('Frontend MongoDB connection error:', err);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

