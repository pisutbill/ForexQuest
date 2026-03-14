import OpenAI from "openai";

export const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function askJson<T>(messages: { role: "system" | "user"; content: string }[]): Promise<T> {
  const response = await client.chat.completions.create({
    model: "gemini-2.5-flash-lite",
    messages,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}