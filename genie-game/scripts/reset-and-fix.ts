import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Clear data (FK is already dropped from previous attempt)
  await client.query(`TRUNCATE TABLE "HistoricalRate"`);
  await client.query(`TRUNCATE TABLE "Currency"`);

  // Re-add FK pointing to Currency
  await client.query(`
    ALTER TABLE "HistoricalRate"
    DROP CONSTRAINT IF EXISTS "HistoricalRate_countryId_fkey"
  `);
  await client.query(`
    ALTER TABLE "HistoricalRate"
    ADD CONSTRAINT "HistoricalRate_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Currency"(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
  `);

  console.log("Done. Tables cleared and FK fixed. Re-run seed scripts now.");
  await client.end();
}

main().catch(console.error);
