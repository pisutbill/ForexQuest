import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/app/lib/llm';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type CountryChatRequest = {
  country: string;
  year: number;
  messages: ChatMessage[];
};

export async function POST(req: NextRequest) {
  try {
    const { country, year, messages } = (await req.json()) as CountryChatRequest;

    if (!country || !year || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await client.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a concise forex game analyst. The user is considering investing in ${country} in ${year}.
Answer questions about the country's economic, political, and financial conditions in that year.
Keep answers short and focused — this is a game UI, not a report.
Do not reference events after ${year}.`,
        },
        ...messages,
      ],
    });

    const reply = response.choices[0]?.message?.content ?? 'No response available.';
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
}
