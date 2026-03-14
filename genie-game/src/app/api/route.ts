import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "API is running" });
}

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an FX game analyst.
Use only the data provided.
Do not invent facts.
Be concise and clear.
Return:
1. a short summary
2. 3 reasons
3. a one-line verdict`,
        },
        {
          role: "user",
          content: JSON.stringify(body, null, 2),
        },
      ],
    });

    return NextResponse.json({
      output: response.choices[0]?.message?.content ?? "",
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}