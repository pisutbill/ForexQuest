import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FIXER_KEY = process.env.FIXER_API_KEY;

const GAME_CURRENCIES = [
  'AUD','CAD','CHF','CYP','CZK','DKK','EEK','EUR','GBP','HKD',
  'HUF','ISK','JPY','KRW','LTL','LVL','MTL','NOK','NZD','PLN',
  'ROL','SEK','SGD','SIT','SKK','TRL','ZAR','BGN','CNY','HRK',
  'IDR','MYR','PHP','RON','RUB','THB','TRY','BRL','MXN','INR',
  'ILS','ANG','AWG','BBD','BMD','BSD','FKP','KPW','LKR','PAB',
  'SAR','SHP','TWD','XDR','XPF','AED','ALL','ARS','BDT','BHD',
  'BIF','BND','BOB','BTN','BWP','BZD','CLP','COP','CRC','CVE',
  'DJF','DOP','EGP','ETB','FJD','GIP','GMD','GNF','GTQ','GYD',
  'HNL','HTG','IQD','IRR','JMD','JOD','KES','KHR','KMF','KWD',
  'KZT','LAK','LBP','LSL','LYD','MAD','MMK','MNT','MOP','MUR',
  'MVR','MWK','NAD','NGN','NIO','NPR','OMR','PEN','PGK','PKR',
  'PYG','QAR','SBD','SCR','SLL','SOS','SVC','SYP','SZL','TND',
  'TOP','TTD','TZS','UAH','UGX','VND','VUV','WST','XAF','XCD',
  'XOF','ZMK','AMD','BYR','CDF','DZD','GEL','KGS','MDL','MKD',
  'RWF','STD','TJS','UZS','YER','UYU','LRD','AOA','MGA','AFN',
  'AZN','BAM','GHS','MZN','RSD','SDG','SRD','TMT','CLF','BTC',
  'CUP','JEP','KYD','ZWL','ERN','XAG','XAU','ZMW','GGP','IMP',
  'CUC','BYN','CNH','MRU','SLE','VES','STN','XCG','USD',
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
