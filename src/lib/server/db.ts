import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
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

/**
 * Connects to the MongoDB database and returns the connection.
 * This function is only meant to be used in server-side code (API routes, getServerSideProps, etc.).
 * Do not use this in client-side code or middleware.
 */
export async function connectDB() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('connectDB cannot be used in Edge Runtime. Use Clerk session claims instead.');
  }

  if (global.mongoose?.conn) {
    return global.mongoose.conn;
  }

  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }

  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: false,
    };

    global.mongoose.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    global.mongoose.conn = await global.mongoose.promise;
  } catch (e) {
    global.mongoose.promise = null;
    throw e;
  }

  return global.mongoose.conn;
}

/**
 * Use this function to safely run database operations in API routes.
 * It ensures the database is connected and handles errors appropriately.
 */
export async function withDB<T>(fn: () => Promise<T>): Promise<T> {
  try {
    await connectDB();
    return await fn();
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Database operation failed');
  }
}

// Export mongoose for cases where direct access is needed
export { mongoose };
