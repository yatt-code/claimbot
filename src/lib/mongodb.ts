import mongoose from 'mongoose';

function getMongDBURI(): string {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }
  
  return MONGODB_URI;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface CachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Extend the NodeJS global type to include mongoose for hot-reload safe caching
  // eslint-disable-next-line no-var
  var mongoose: CachedMongoose | undefined;
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }

  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: false,
      // Remove explicit TLS options to let Mongoose/driver handle Atlas SRV URI defaults
    };

    global.mongoose.promise = mongoose.connect(getMongDBURI(), opts).then((mongoose) => {
      return mongoose;
    });
  }
  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

export default dbConnect;