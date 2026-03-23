import mongoose from "mongoose";

const URI = process.env.MONGODB_URI!;

if (!URI) throw new Error("MONGODB_URI is not set in .env.local");

// Cache connection across hot-reloads in dev
let cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose;

if (!cached) {
  cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(URI, { bufferCommands: false });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
