import { NextRequest, NextResponse } from "next/server";
import { askJson } from "@/app/lib/llm";

type Holding = {
  country: string;
  currency?: string;
  yearTransition: string;
  currentValue: number;
  rateChange: number;
};

type ResultOverviewInput = {
  holdings: Holding[];
};

type ResultOverviewOutput = {
  summary: string;
  portfolioTrend: "positive" | "negative" | "mixed" | "flat";
  key_drivers: string[];
  best_performer?: string;
  worst_performer?: string;
  verdict: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ResultOverviewInput;

    const result = await askJson<ResultOverviewOutput>([
      {
        role: "system",
        content: `You are a forex game analyst.

Your job is to summarize a user's portfolio after a trade round.

Rules:
- Look across all holdings together.
- Identify the overall direction of the portfolio.
- Explain major shared trends, strongest winners, and biggest drags.
- Keep it concise and readable for a game UI.
- Write the "summary" field in structured markdown.
- Use headings, bullets, and bold emphasis.
- Do not wrap markdown in code fences.
- Return ONLY valid JSON.

Formatting requirements for "summary":
- Start with "## Portfolio Overview"
- Then "## Key Drivers"
- End with "## Bottom Line"
- Use bullet points under "Key Drivers"
- Use bold emphasis for major patterns like **broad dollar strength**, **regional weakness**, **portfolio concentration**, **best performer**, **worst performer**
- Keep it under 160 words

Return exactly this shape:
{
  "summary": "string",
  "portfolioTrend": "positive" | "negative" | "mixed" | "flat",
  "key_drivers": ["string", "string", "string"],
  "best_performer": "string",
  "worst_performer": "string",
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