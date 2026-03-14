import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Years to collect
const START_YEAR = 2000;
const END_YEAR = new Date().getFullYear();

// Base currency
const BASE = "USD";

async function fetchRatesForYear(year: number): Promise<Record<string, number> | null> {
  const date = `${year}-01-01`;
  const res = await fetch(`https://api.frankfurter.app/${date}?base=${BASE}`);

  if (!res.ok) {
    console.warn(`Failed to fetch rates for ${year}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.rates as Record<string, number>;
}

async function main() {
  console.log(`Seeding historical rates from ${START_YEAR} to ${END_YEAR}...`);

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const rates = await fetchRatesForYear(year);
    if (!rates) continue;

    for (const [code, rate] of Object.entries(rates)) {
      // Upsert country
      const country = await prisma.country.upsert({
        where: { countryCode: code },
        update: {},
        create: { countryCode: code },
      });

      // Upsert historical rate
      await prisma.historicalRate.upsert({
        where: { countryId_year: { countryId: country.id, year } },
        update: { rate },
        create: { countryId: country.id, year, rate },
      });
    }

    console.log(`✓ ${year} — ${Object.keys(rates).length} currencies`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
