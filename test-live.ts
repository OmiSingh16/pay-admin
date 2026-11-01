import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as schema from "./db/schema";

dotenv.config({ path: ".env.local" });

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function test() {
  const u = await db.select({ id: schema.users.id }).from(schema.users).limit(1);
  
  if (!u.length) {
    console.log("❌ No users found. Run seed first.");
    process.exit(1);
  }

  await db.insert(schema.depositOrders).values({
    userId: u[0].id,
    priceInr: "999.00",
    tokens: 999,
    utr: "TEST" + Date.now(),
    status: "pending",
    dealDate: new Date(),
  });
  
  console.log("✅ Test deposit inserted! Check dashboard in 10 seconds.");
  await client.end();
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});