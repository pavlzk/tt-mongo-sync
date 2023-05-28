import { faker } from "@faker-js/faker";
import { Db } from "mongodb";
import * as config from "./config";
import { connect } from "./db";
import { FakeCustomer } from "./types";
import { randomInt } from "./utils";

const minDocs: number = 1;
const maxDocs: number = 20;

async function main(): Promise<void> {
  const db = await connect();
  setInterval(() => {
    addCustomers(db, randomInt(minDocs, maxDocs));
  }, 200);
}

function generateCustomer(): FakeCustomer {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: {
      line1: faker.location.streetAddress(),
      line2: faker.location.secondaryAddress(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      country: faker.location.countryCode(),
    },
    createdAt: new Date(),
  };
}

function generateCustomers(num: number): Array<FakeCustomer> {
  return [...Array(num)].map(generateCustomer);
}

async function addCustomers(db: Db, num: number): Promise<void> {
  const { insertedCount } = await db
    .collection(config.sourceCollection)
    .insertMany(generateCustomers(num));

  console.log(`Inserted ${insertedCount} docs`);
}

main().catch(console.log);
