import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import * as dotenv from "dotenv";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function seedData() {
  console.log("Clearing old data...");
  await db.execute(sql`TRUNCATE TABLE audit_log, wallet_ledger, upi_requests, withdraw_orders, deposit_orders, users RESTART IDENTITY CASCADE`);

  console.log("Generating users...");
  const pinHash = await hash("123456", { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
  
  const usersToInsert = Array.from({ length: 190 }, (_, i) => ({
    balance: (Math.random() * 5000).toFixed(2),
    pinHash,
    status: (i % 15 === 0 ? "blocked" : "active") as any,
  }));

  const insertedUsers = await db.insert(schema.users).values(usersToInsert).returning({ id: schema.users.id });
  const userIds = insertedUsers.map(u => u.id);

  console.log("Generating deposit orders...");
  const depositOrders = Array.from({ length: 120 }, (_, i) => {
    const status = i < 9 ? "pending" : (i < 15 ? "rejected" : "approved");
    return {
      userId: userIds[Math.floor(Math.random() * userIds.length)],
      priceInr: (Math.floor(Math.random() * 5000) + 100).toFixed(2),
      tokens: Math.floor(Math.random() * 5000) + 100,
      utr: `UTR${Math.floor(Math.random() * 1000000000)}`,
      status: status as any,
      dealDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
    };
  });
  await db.insert(schema.depositOrders).values(depositOrders);

  console.log("Generating withdraw orders...");
  const withdrawOrders = Array.from({ length: 120 }, (_, i) => {
    const status = i < 4 ? "pending" : (Math.random() > 0.2 ? "approved" : "rejected");
    return {
      userId: userIds[Math.floor(Math.random() * userIds.length)],
      priceInr: (Math.floor(Math.random() * 5000) + 100).toFixed(2),
      tokens: Math.floor(Math.random() * 5000) + 100,
      upiId: `user${i}@ybl`,
      status: status as any,
      dealDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      paidConfirmedAt: status === "approved" ? new Date() : null,
    };
  });
  await db.insert(schema.withdrawOrders).values(withdrawOrders);

  console.log("Generating UPI requests...");
  const upiRequests = Array.from({ length: 20 }, (_, i) => {
    const status = i < 5 ? "pending" : (Math.random() > 0.5 ? "approved" : "rejected");
    return {
      userId: userIds[Math.floor(Math.random() * userIds.length)],
      upiId: `user${i}@okhdfcbank`,
      enabled: i % 3 !== 0,
      status: status as any,
      risk: (["low", "medium", "high"] as any[])[i % 3],
      riskNote: "Auto-generated risk note",
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
    };
  });
  await db.insert(schema.upiRequests).values(upiRequests);

  console.log("✅ Seed data inserted successfully!");
  await client.end();
}

seedData().catch((e) => {
  console.error(e);
  process.exit(1);
});