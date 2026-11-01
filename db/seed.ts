import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";
import * as dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config({ path: ".env.local" });

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding admin...");
  
  const email = "admin@jpgpay.com";
  const password = "Admin@123";
  const passwordHash = await hash(password, { 
    memoryCost: 19456, 
    timeCost: 2, 
    outputLen: 32, 
    parallelism: 1 
  });

  // Delete existing to avoid duplicate
  await db.execute(`DELETE FROM admins WHERE email = '${email}'`);

  await db.insert(schema.admins).values({
    email,
    passwordHash,
    role: "owner",
  });

  console.log(`✅ Owner Admin Created:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`(Add TOTP later from settings)`);
  
  await client.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
