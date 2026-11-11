
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "qwen3:0.6b";

const SYSTEM_PROMPT = `
You are NEXUS AI, the personal AI assistant inside NEXUS CORE.

Your purpose is to help users learn, code, solve problems, and work productively.
Explain difficult concepts in simple language.
When writing code, provide accurate and practical examples.
Be honest about your limitations. Never claim you performed an action you did not perform.
Keep responses clear, useful, and appropriately detailed.
`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "NEXUS AI",
    engine: "Ollama",
    model: MODEL,
  });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("messages" in body) ||
      !Array.isArray(body.messages)
    ) {
      return NextResponse.json(
        { error: "A messages array is required." },
        { status: 400 }
      );
    }

    if (body.messages.length < 1 || body.messages.length > 30) {
      return NextResponse.json(
        { error: "Send between 1 and 30 messages." },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = [];

    for (const item of body.messages) {
      if (typeof item !== "object" || item === null) {
        return NextResponse.json(
          { error: "Invalid message format." },
          { status: 400 }
        );
      }

      const message = item as Record<string, unknown>;

      if (
        (message.role !== "user" &&
          message.role !== "assistant") ||
        typeof message.content !== "string" ||
        !message.content.trim() ||
        message.content.length > 12000
      ) {
        return NextResponse.json(
          { error: "Invalid message content." },
          { status: 400 }
        );
      }

      messages.push({
        role: message.role,
        content: message.content.trim(),
      });
    }

    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "The latest message must be from the user." },
        { status: 400 }
      );
    }

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        options: {
          temperature: 0.7,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      console.error(
        "Ollama returned HTTP status:",
        response.status
      );

      return NextResponse.json(
        {
          error:
            "NEXUS AI could not get a response from Ollama. Check that Ollama is running.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return NextResponse.json(
        { error: "The AI returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply: reply.trim(),
      model: MODEL,
    });
  } catch (error) {
    console.error("NEXUS AI error:", error);

    const timedOut =
      error instanceof Error &&
      error.name === "TimeoutError";

    return NextResponse.json(
      {
        error: timedOut
          ? "NEXUS AI took too long to respond. Please try again."
          : "Unable to connect to NEXUS AI. Check that Ollama is running.",
      },
      { status: timedOut ? 504 : 500 }
    );
  }
}
