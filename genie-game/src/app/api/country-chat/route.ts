import { NextRequest, NextResponse } from "next/server";
import { askJson } from "@/app/lib/llm";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CountryChatInput = {
  country: string;
  year: number;
  messages: ChatMessage[];
};

type CountryChatOutput = {
  reply: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CountryChatInput;

    const result = await askJson<CountryChatOutput>([
      {
        role: "system",
        content: `You are a pre-trade forex country analyst inside a historical investment game.

Your job:
- Help the player understand whether investing in a country in a given year looks risky or attractive.
- Focus only on the specified country and year.
- Answer clearly and briefly.
- Be conversational, like a helpful analyst in a game.
- Do not give generic real-world financial advice.
- Do not wander into unrelated countries unless directly comparing.
- Keep most answers under 120 words unless the user asks for more detail.

Return ONLY valid JSON:
{
  "reply": "string"
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