"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  country: string;
  year: number;
  open: boolean;
  onClose: () => void;
};

export default function CountryChatPopup({
  country,
  year,
  open,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi — ask me anything about ${country} in ${year} before you invest.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi — ask me anything about ${country} in ${year} before you invest.`,
      },
    ]);
    setInput("");
  }, [country]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/country-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country,
          year,
          messages: nextMessages,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-black/30">
      <div className="m-6 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {country} · {year}
            </h2>
            <p className="text-xs text-gray-500">Pre-trade country analyst</p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "ml-auto bg-black text-white"
                  : "bg-gray-100 text-black"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="max-w-[85%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-black">
              Thinking...
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder={`Ask about ${country} in ${year}...`}
              className="flex-1 rounded-xl border px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}