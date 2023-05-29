import crypto from "crypto";
import { Customer } from "./types";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomString(len: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...Array(len)]
    .map(() => chars.charAt(randomInt(0, chars.length - 1)))
    .join("");
}

/**
 * Generate hash from string
 * @param str input string
 * @param length result string length
 * @return string matches [a-zA-Z\d]
 */
export function anonymizeString(str: string, length: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  const hash = crypto.createHash("sha256").update(str).digest();

  for (let i = 0; i < length; i++) {
    const idx = hash.readUInt8(i % 32) % chars.length;
    result += chars.charAt(idx);
  }

  return result;
}

export function anonymizeCustomer(doc: Customer): Customer {
  const emailArr = doc.email.split("@");
  emailArr[0] = anonymizeString(doc.email);

  return {
    ...doc,
    firstName: anonymizeString(doc.firstName),
    lastName: anonymizeString(doc.lastName),
    email: emailArr.join("@"),
    address: {
      ...doc.address,
      line1: anonymizeString(doc.address.line1),
      line2: anonymizeString(doc.address.line2),
      postcode: anonymizeString(doc.address.postcode),
    },
  };
}
