import mongoose from "mongoose";

const globalWithMongoose = globalThis as typeof globalThis & {
__mongooseConn?: Promise<typeof mongoose>;
};

export async function connect() {
if (mongoose.connection.readyState === 1) {
return;
}


try {
    if (!globalWithMongoose.__mongooseConn) {
        globalWithMongoose.__mongooseConn = mongoose.connect(
            process.env.NEXT_PUBLIC_MONGODB_URI ||
                "mongodb://127.0.0.1:27017",
            {
                dbName: "WasteEasy",
                serverSelectionTimeoutMS: 5000,
            }
        );
    }

    await globalWithMongoose.__mongooseConn;
    console.log("MongoDB connected successfully");
} catch (error) {
    globalWithMongoose.__mongooseConn = undefined;
    console.error("MongoDB connection error:", error);
    throw error;
}


}
