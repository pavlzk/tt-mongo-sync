import { ObjectId } from "mongodb";

export type Customer = {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    postcode: string;
    city: string;
    state: string;
    country: string;
  };
  createdAt: Date;
};

export type FakeCustomer = Omit<Customer, "_id">;

export type AnonymizeFn = (doc: Customer) => Customer;
