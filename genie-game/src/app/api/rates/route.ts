import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FIXER_KEY = process.env.FIXER_API_KEY;

const GAME_CURRENCIES = [
  'GBP','EUR','JPY','CNY','AUD','CAD','CHF','INR','BRL','MXN',
  'KRW','SGD','HKD','NOK','SEK','DKK','NZD','ZAR','TRY','THB',
  'MYR','IDR','PHP','VND','AED','SAR','EGP','NGN','ARS','CLP',
  'PLN','CZK','HUF','RUB','ILS','USD',
];

async function getRatesFromDB(year: number): Promise<Record<string, number> | null> {
  const rows = await prisma.historicalRate.findMany({
    where: { year, country: { countryCode: { in: GAME_CURRENCIES } } },
    include: { country: true },
  });

  if (rows.length === 0) return null;

  return Object.fromEntries(rows.map((r) => [r.country.countryCode, r.rate]));
}


async function getRatesFromFixer(year: number): Promise<Record<string, number> | null> {
  if (!FIXER_KEY) return null;

  const date = `${year}-07-01`;
  const symbols = GAME_CURRENCIES.join(',');
  const url = `https://data.fixer.io/api/${date}?access_key=${FIXER_KEY}&symbols=${symbols}`;

  try {
    const res = await fetch(url, { cache: 'force-cache' });
    const data = await res.json();
    if (!data.success) return null;

    const eurToUsd = data.rates.USD as number;
    const rates: Record<string, number> = {};
    for (const [code, eurRate] of Object.entries(data.rates as Record<string, number>)) {
      if (code === 'USD') continue;
      rates[code] = (eurRate as number) / eurToUsd;
    }
    return rates;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const year = parseInt(request.nextUrl.searchParams.get('year') ?? '');

  if (isNaN(year) || year < 2000 || year > 2030) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  // 1. Try DB first
  const dbRates = await getRatesFromDB(year);
  if (dbRates) {
    return NextResponse.json({ rates: dbRates, year, source: 'db' });
  }

  // 2. Fall back to Fixer API
  const fixerRates = await getRatesFromFixer(year);
  if (fixerRates) {
    return NextResponse.json({ rates: fixerRates, year, source: 'fixer' });
  }

  return NextResponse.json(
    { error: 'No rate data available for this year', rates: null },
    { status: 404 }
  );
}
