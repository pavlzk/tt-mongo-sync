import { Db, MongoClient } from "mongodb";
import * as config from "./config";

const client = new MongoClient(config.dbUrl);

export async function connect(): Promise<Db> {
  await client.connect();
  return client.db(config.dbName);
}
