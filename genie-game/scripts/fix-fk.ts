import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  await client.query(`ALTER TABLE "HistoricalRate" DROP CONSTRAINT IF EXISTS "HistoricalRate_countryId_fkey"`);
  await client.query(`ALTER TABLE "HistoricalRate" ADD CONSTRAINT "HistoricalRate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Currency"(id) ON DELETE RESTRICT ON UPDATE CASCADE`);
  console.log("Foreign key fixed.");
  await client.end();
}

main().catch(console.error);
