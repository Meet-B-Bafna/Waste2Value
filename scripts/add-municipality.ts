import mongoose from "mongoose";
import { connect } from "../src/database/db";
import Municipality from "../src/models/municipality.model";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  try {
    await connect();

    const latitude = 18.745294493185465;
    const longitude = 73.41349853746718;

    // Temporary test boundary: approximately 500 m around your location.
    const offset = 0.005;

    const ring = [
      [longitude - offset, latitude - offset],
      [longitude + offset, latitude - offset],
      [longitude + offset, latitude + offset],
      [longitude - offset, latitude + offset],
      [longitude - offset, latitude - offset],
    ];

    await Municipality.findOneAndUpdate(
      { name: "waste2value-test" },
      {
        name: "waste2value-test",
        officeName: "Waste2Value Test Office",
        email: process.env.TEST_MUNICIPALITY_EMAIL,
        boundary: {
          type: "Polygon",
          coordinates: [ring],
        },
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log("Temporary test municipality created successfully.");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();