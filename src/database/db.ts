import mongoose from "mongoose";

// Cache the connection across hot reloads / multiple route imports so we don't
// open a new connection (or attach new listeners) on every API route load.
const globalWithMongoose = globalThis as typeof globalThis & { __mongooseConn?: Promise<typeof mongoose> };

export async function connect() {
    // 1 = connected, 2 = connecting
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;
    try {
        if (!globalWithMongoose.__mongooseConn) {
            globalWithMongoose.__mongooseConn = mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb://localhost:27017", {
                dbName: "Waste-Easy",
                serverSelectionTimeoutMS: 5000,
            });
        }
        await globalWithMongoose.__mongooseConn;
        console.log("MongoDB connected successfully");
    } catch (error) {
        // allow a retry on the next request instead of killing the dev server
        globalWithMongoose.__mongooseConn = undefined;
        console.log("MongoDB connection error. Please make sure MongoDB is running (mongod) or set NEXT_PUBLIC_MONGODB_URI in .env.local");
        console.log(error);
    }
}
