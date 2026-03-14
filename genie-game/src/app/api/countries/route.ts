import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const rows = await prisma.country.findMany({
    include: { Currency: true },
  });

  const mapping: Record<string, { code: string; name: string }> = {};
  for (const row of rows) {
    mapping[row.countryName] = {
      code: row.Currency.countryCode,
      name: row.Currency.currencyName ?? row.Currency.countryCode,
    };
  }

  return NextResponse.json({ countries: mapping });
}
