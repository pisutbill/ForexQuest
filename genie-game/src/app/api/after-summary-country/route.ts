import { NextRequest, NextResponse } from "next/server";
import { askJson } from "@/app/lib/llm";

type AfterSummaryCountryInput = {
  country: string;
  currency?: string;
  yearTransition: string;
  currentValue: number;
  rateChange: number;
  position?: "long" | "short";
  amountInvested?: number;
};

type AfterSummaryCountryOutput = {
  country: string;
  yearTransition: string;
  performance: "up" | "down" | "flat";
  explanation: string;
  reasons: string[];
  verdict: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AfterSummaryCountryInput;

    const result = await askJson<AfterSummaryCountryOutput>([
      {
        role: "system",
        content: `You are a forex game analyst.

Your job is to explain why a user's single-country trade went up or down over a given year transition.

Rules:
- Use the given trade data.
- Explain performance clearly in plain language.
- Connect the result to likely economic, financial, or political conditions for that country in that transition period.
- If the trade result is positive, explain why it likely gained.
- If the trade result is negative, explain why it likely lost.
- If near zero, treat as flat.
- Return ONLY valid JSON.

Return exactly this shape:
{
  "country": "string",
  "yearTransition": "string",
  "performance": "up" | "down" | "flat",
  "explanation": "string",
  "reasons": ["string", "string", "string"],
  "verdict": "string"
}`,
      },
      {
        role: "user",
        content: JSON.stringify(body, null, 2),
      },
    ]);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}