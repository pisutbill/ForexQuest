import { NextRequest, NextResponse } from "next/server";
import { askJson } from "@/app/lib/llm";

type BeforeSummaryCountryInput = {
  year: number;
  country: string;
};

type BeforeSummaryCountryOutput = {
  country: string;
  year: number;
  overview: string;
  key_points: string[];
  risk: "low" | "mid" | "high";
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BeforeSummaryCountryInput;

    const result = await askJson<BeforeSummaryCountryOutput>([
      {
        role: "system",
        content: `You are a forex game analyst.

Your job is to give a short pre-trade investment overview for one country in one year.

Rules:
- Be concise and informative.
- Focus on financial, economic, and political conditions relevant to currency risk.
- Speak as if helping a player decide whether this country looks stable or risky before investing.
- Do not mention future years beyond the specified year.
- Write the "overview" field in well-structured markdown.
- The markdown should feel polished and readable in a UI.
- Use short sections, bold emphasis, and bullet points where helpful.
- Do not wrap the markdown in code fences.
- Return ONLY valid JSON.

Formatting requirements for "overview":
- Start with a heading: "## Market Snapshot"
- Then add a second heading: "## Why It Matters"
- End with a third heading: "## Takeaway"
- Use bullet points under "Why It Matters"
- Use bold emphasis for important terms like **exports**, **inflation**, **political unrest**, **currency pressure**, **investor confidence**
- Keep the whole overview under 140 words

Return exactly this shape:
{
  "country": "string",
  "year": 0,
  "overview": "string",
  "key_points": ["string", "string", "string"],
  "risk": "low" | "mid" | "high"
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