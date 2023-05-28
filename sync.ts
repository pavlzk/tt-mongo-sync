import * as fs from "fs";
import { Collection, ResumeToken } from "mongodb";
import { AnonymizeFn, Customer } from "./types";
import { anonymizeCustomer } from "./utils";
import { connect } from "./db";
import { sourceCollection, targetCollection } from "./config";

function isReIndex(): boolean {
  return process.argv[2] === "--full-reindex";
}

async function main(): Promise<void> {
  const db = await connect();
  const sync = new Sync(
    db.collection(sourceCollection),
    db.collection(targetCollection),
    anonymizeCustomer
  );

  if (isReIndex()) {
    await sync.reindex();
  } else {
    await sync.watch();
  }
}

class Sync {
  source: Collection;
  target: Collection;
  syncBatchSize = 1000;
  reindexBatchSize = 100000;
  queue: Customer[] = [];
  resumeToken?: ResumeToken;
  anonymize: AnonymizeFn;

  constructor(source: Collection, target: Collection, anonymize: AnonymizeFn) {
    this.source = source;
    this.target = target;
    this.anonymize = anonymize;
  }

  /**
   * Start live sync mode
   */
  async watch(): Promise<void> {
    setInterval(() => this.processBatch(this.syncBatchSize), 1000);
    await this.sourceWatch();
  }

  /**
   * Watch source collection for new and updated documents and store in the queue
   */
  async sourceWatch() {
    const resumeToken = await this.readResumeToken();

    let changeStream = this.source.watch([], {
      fullDocument: "updateLookup",
      resumeAfter: resumeToken,
    });

    for await (const change of changeStream) {
      if (
        change.operationType === "insert" ||
        change.operationType === "update" ||
        change.operationType === "replace"
      ) {
        this.queue.push(change.fullDocument as Customer);
        this.resumeToken = change._id;

        if (this.queue.length >= this.syncBatchSize) {
          await this.processBatch(this.syncBatchSize);
        }
      }
    }

    await changeStream.close();
  }

  /**
   * Anonymize batch of documents in the queue and store write to target collection
   * Existing documents will be replaced
   * @param size number of documents to process
   */
  async processBatch(size: number) {
    let ops = this.queue
      .splice(0, size)
      .map(this.anonymize)
      .map((doc) => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true,
        },
      }));

    if (ops.length) await this.target.bulkWrite(ops);
    console.log(`${ops.length} docs processed`);
    await this.writeResumeToken();
  }

  /**
   * Full reindex of source collection
   */
  async reindex() {
    const docs = this.source.find<Customer>({});

    for await (const doc of docs) {
      this.queue.push(doc);
      if (this.queue.length >= this.reindexBatchSize || !(await docs.hasNext()))
        await this.processBatch(this.reindexBatchSize);
    }

    process.exit(0);
  }

  /**
   * Save resume token to file
   */
  async writeResumeToken(): Promise<void> {
    if (this.resumeToken) {
      await fs.promises.writeFile(
        "resume-token.txt",
        JSON.stringify(this.resumeToken),
        "utf8"
      );
      console.log("The resume token has been saved");
    }
  }

  /**
   * Load resume token from file
   */
  async readResumeToken(): Promise<ResumeToken | null> {
    try {
      const token = await fs.promises.readFile("resume-token.txt", {
        encoding: "utf8",
      });
      return JSON.parse(token);
    } catch (e) {
      return null;
    }
  }
}

main().catch(console.log);
