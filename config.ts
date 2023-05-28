import * as dotenv from "dotenv";

dotenv.config();

// Connection URL
export const dbUrl: string =
  process.env.DB_URI || "mongodb://localhost:27017?replicaSet=rs0";

// Database name
export const dbName: string = "test";

// Source collection name
export const sourceCollection: string = "customers";

// Target collection name
export const targetCollection: string = "customers_anonymised";
