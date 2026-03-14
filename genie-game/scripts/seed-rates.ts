import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const START_YEAR = 2000;
const END_YEAR = new Date().getFullYear();
const API_KEY = process.env.FIXER_API_KEY!;

// Fixer free plan only supports EUR base — we convert to USD by dividing by EUR/USD rate
async function fetchRatesForYear(year: number): Promise<Record<string, number> | null> {
  const date = `${year}-01-01`;
  const res = await fetch(`http://data.fixer.io/api/${date}?access_key=${API_KEY}`);

  if (!res.ok) {
    console.warn(`Failed to fetch rates for ${year}: ${res.status}`);
    return null;
  }

  const data = await res.json();

  if (!data.success) {
    console.warn(`Fixer error for ${year}:`, data.error?.info ?? data.error);
    return null;
  }

  const eurRates: Record<string, number> = data.rates;
  const eurToUsd = eurRates["USD"];

  if (!eurToUsd) {
    console.warn(`No USD rate for ${year}, skipping`);
    return null;
  }

  // Convert all EUR-based rates to USD-based rates
  const usdRates: Record<string, number> = {};
  for (const [code, rate] of Object.entries(eurRates)) {
    if (code === "USD") continue;
    usdRates[code] = rate / eurToUsd;
  }

  return usdRates;
}

async function main() {
  console.log(`Seeding historical rates (USD base) from ${START_YEAR} to ${END_YEAR}...`);

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const rates = await fetchRatesForYear(year);
    if (!rates) continue;

    for (const [code, rate] of Object.entries(rates)) {
      const country = await prisma.currency.upsert({
        where: { countryCode: code },
        update: {},
        create: { countryCode: code },
      });

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
