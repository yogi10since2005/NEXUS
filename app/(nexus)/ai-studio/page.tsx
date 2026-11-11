
"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to NEXUS AI Studio. I'm ready to help you code, learn, brainstorm ideas, solve problems, and build something amazing. What shall we work on?",
};

const SUGGESTIONS = [
  {
    icon: "⌘",
    title: "Write code",
    description: "Build a feature or debug code",
    prompt: "Help me build a useful feature for my NEXUS project.",
  },
  {
    icon: "✳",
    title: "Learn something",
    description: "Explain a difficult concept simply",
    prompt: "Teach me an interesting computer science concept with an example.",
  },
  {
    icon: "◈",
    title: "Brainstorm ideas",
    description: "Explore ideas and possibilities",
    prompt: "Give me five innovative AI-powered project ideas for my portfolio.",
  },
  {
    icon: "↗",
    title: "Solve a problem",
    description: "Break a challenge into steps",
    prompt: "Help me solve a difficult problem by breaking it into simple steps.",
  },
];

export default function AIStudioPage() {
  const [messages, setMessages] = useState<Message[]>([
    WELCOME_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();

    if (!content || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((message) => message.id !== "welcome")
            .map(({ role, content: messageContent }) => ({
              role,
              content: messageContent,
            })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get an AI response.");
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function startNewChat() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setError("");
    setCopiedId("");
    textareaRef.current?.focus();
  }

  async function copyMessage(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch {
      setError("Could not copy the response. Please copy it manually.");
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#08090f] text-white">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/[0.09] blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-500/[0.05] blur-[120px]" />

      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-xl text-violet-300 shadow-[0_0_25px_rgba(139,92,246,0.10)]">
            ✳
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              AI Studio
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              <p className="text-xs text-white/40">
                NEXUS intelligence workspace
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={startNewChat}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="mr-2">＋</span>
          New chat
        </button>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-xs text-white/60">Gemini AI</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/40">Text chat</span>
          </div>

          <p className="text-xs text-white/30">
            Conversations are kept in this page session
          </p>
        </div>

        <section
          className="flex flex-1 flex-col gap-6 py-6"
          aria-label="AI conversation"
          aria-live="polite"
        >
          {messages.length === 1 && (
            <div className="my-auto py-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 text-3xl shadow-[0_0_50px_rgba(139,92,246,0.12)]">
                ✳
              </div>

              <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-violet-300/80">
                Your intelligence layer
              </p>

              <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                Think bigger.
                <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Build without limits.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 md:text-base">
                Your personal AI workspace for development, learning,
                creative thinking, and problem solving.
              </p>

              <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    onClick={() => sendMessage(suggestion.prompt)}
                    disabled={loading}
                    className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-violet-500/[0.06] disabled:opacity-40"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-lg text-violet-300 transition group-hover:border-violet-400/20 group-hover:bg-violet-500/10">
                      {suggestion.icon}
                    </div>
                    <p className="text-sm font-medium text-white/85">
                      {suggestion.title}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {suggestion.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            if (message.id === "welcome" && messages.length > 1) {
              return null;
            }

            const isAssistant = message.role === "assistant";

            return (
              <article
                key={message.id}
                className={`flex gap-3 ${
                  isAssistant ? "items-start" : "items-start justify-end"
                }`}
              >
                {isAssistant && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                    ✳
                  </div>
                )}

                <div
                  className={`min-w-0 max-w-[88%] md:max-w-[80%] ${
                    isAssistant
                      ? "rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.035] px-4 py-4 md:px-5"
                      : "rounded-2xl rounded-tr-sm border border-violet-400/20 bg-violet-500/[0.12] px-4 py-3 md:px-5"
                  }`}
                >
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    {isAssistant ? "NEXUS AI" : "You"}
                  </p>

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/85">
                    {message.content}
                  </p>

                  {isAssistant && message.id !== "welcome" && (
                    <button
                      onClick={() => copyMessage(message)}
                      className="mt-4 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/45 transition hover:border-violet-400/25 hover:text-white/80"
                    >
                      {copiedId === message.id
                        ? "✓ Copied"
                        : "▢ Copy response"}
                    </button>
                  )}
                </div>

                {!isAssistant && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-500/[0.08] text-xs font-semibold text-cyan-200">
                    Y
                  </div>
                )}
              </article>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                ✳
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.035] px-5 py-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  NEXUS AI is thinking
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200/90"
          >
            <p>{error}</p>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0 text-red-200/60 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
          className="sticky bottom-0 z-20 pb-5 pt-3"
        >
          <div className="rounded-2xl border border-white/[0.11] bg-[#10111a]/95 p-3 shadow-[0_10px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl transition focus-within:border-violet-400/35">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(
                  event.target.scrollHeight,
                  180
                )}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Message NEXUS AI..."
              rows={1}
              maxLength={12000}
              disabled={loading}
              aria-label="Message NEXUS AI"
              className="max-h-[180px] min-h-[48px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 disabled:opacity-50"
            />

            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-1 pt-3">
              <p className="text-[10px] text-white/30">
                Enter to send · Shift + Enter for a new line
              </p>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 text-sm font-medium text-white shadow-[0_0_20px_rgba(139,92,246,0.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {loading ? "Thinking..." : "Send"}
                {!loading && <span>↗</span>}
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] text-white/25">
            AI responses can be inaccurate. Verify important information.
          </p>
        </form>
      </div>
    </main>
  );
}
