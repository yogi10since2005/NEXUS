
"use client";

import { useEffect, useState } from "react";

type SavedPrompt = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  createdAt: string;
};

const STORAGE_KEY = "nexus-prompt-library";

const templates = [
  {
    name: "Coding Assistant",
    category: "Coding",
    prompt:
      "Act as an experienced software developer. Help me solve the following problem. Explain the solution clearly, provide clean code, and mention important edge cases.\n\nProblem: [Describe your problem]\nLanguage: [Programming language]",
  },
  {
    name: "Study Assistant",
    category: "Study",
    prompt:
      "Act as a patient tutor. Explain the following topic in simple language using clear headings, important points, and examples. End with a short summary.\n\nSubject: [Subject]\nTopic: [Topic]\n",
  },
  {
    name: "Writing Assistant",
    category: "Writing",
    prompt:
      "Help me write clear, natural, and well-structured content. Match the requested audience and tone, preserve the intended meaning, and avoid unnecessary repetition.\n\nPurpose: [Purpose]\nAudience: [Audience]\nKey points: [Key points]",
  },
  {
    name: "Research Assistant",
    category: "Research",
    prompt:
      "Analyse the following topic carefully. Present the key facts, major arguments, and limitations in a structured format. Do not invent facts or citations.\n\nTopic: [Topic]\nScope: [Scope]\nDesired output: [Summary / Report / Comparison]",
  },
];

const categories = [
  "General",
  "Coding",
  "Study",
  "Writing",
  "Research",
  "Creative",
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function PromptEngineerPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [prompt, setPrompt] = useState("");
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [search, setSearch] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setSavedPrompts(parsed as SavedPrompt[]);
        }
      }
    } catch {
      setError("Could not load your saved prompts.");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPrompts));
    } catch {
      setError("Browser storage is full. Copy your prompts before leaving.");
    }
  }, [savedPrompts, isLoaded]);

  const filteredPrompts = savedPrompts.filter((item) =>
    `${item.title} ${item.category} ${item.prompt}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  function loadTemplate() {
    const selected = templates.find(
      (template) => template.name === templateName,
    );

    if (!selected) return;

    setTitle(selected.name);
    setCategory(selected.category);
    setPrompt(selected.prompt);
    setImprovedPrompt("");
    setError("");
    setNotice(`${selected.name} template loaded.`);
    setTemplateName("");
  }

  async function improveWithAI() {
    if (!prompt.trim()) {
      setError("Enter a prompt before asking AI to improve it.");
      return;
    }

    setIsImproving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                "You are the NEXUS Prompt Engineer.",
                "Improve the prompt below so it is clear, specific, structured, and effective.",
                "Preserve the user's original goal. Add useful context or output requirements where appropriate.",
                "Keep placeholders for missing information.",
                "Do not answer the prompt. Return only the improved prompt without introductory commentary.",
                `Category: ${category}`,
                `Title: ${title.trim() || "Untitled prompt"}`,
                "",
                "Original prompt:",
                prompt.trim(),
              ].join("\n"),
            },
          ],
        }),
      });

      const data: { reply?: string; error?: string } =
        await response.json();

      if (!response.ok || !data.reply?.trim()) {
        throw new Error(data.error || "AI could not improve this prompt.");
      }

      setImprovedPrompt(data.reply.trim());
      setNotice("Your prompt has been improved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to NEXUS AI. Check that Ollama is running.",
      );
    } finally {
      setIsImproving(false);
    }
  }

  function savePrompt() {
    if (!prompt.trim()) {
      setError("Enter a prompt before saving.");
      return;
    }

    const saved: SavedPrompt = {
      id: createId(),
      title: title.trim() || "Untitled prompt",
      category,
      prompt: prompt.trim(),
      createdAt: new Date().toISOString(),
    };

    setSavedPrompts((current) => [saved, ...current]);
    setTitle("");
    setCategory("General");
    setPrompt("");
    setImprovedPrompt("");
    setError("");
    setNotice("Prompt saved successfully.");
  }

  function editPrompt(saved: SavedPrompt) {
    setTitle(saved.title);
    setCategory(saved.category);
    setPrompt(saved.prompt);
    setImprovedPrompt("");
    setError("");
    setNotice(`Editing "${saved.title}". Saving will create an updated entry.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyPrompt(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setError("");
      setNotice("Prompt copied to clipboard.");
    } catch {
      setError("Copy failed. Select the prompt text and copy it manually.");
    }
  }

  function deletePrompt(id: string) {
    setSavedPrompts((current) => current.filter((item) => item.id !== id));
    setError("");
    setNotice("Prompt deleted.");
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10";

  const secondaryButton =
    "inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.05]";

  const primaryButton =
    "inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-8 p-5 text-white sm:p-8 lg:p-10">
      <header className="border-b border-white/[0.08] pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
          NEXUS CORE
        </p>

        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Prompt Engineer
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Create, improve, and organise your AI prompts.
            </p>
          </div>

          <p className="text-sm text-white/40">
            {savedPrompts.length} saved{" "}
            {savedPrompts.length === 1 ? "prompt" : "prompts"}
          </p>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3 text-sm text-emerald-200/90"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-white/[0.09] bg-[#101019]/70 p-5 sm:p-7">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Create a prompt</h2>
            <p className="mt-1 text-sm text-white/40">
              Write your instructions or start with a template.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Choose a prompt template"
              className="max-w-full rounded-xl border border-white/10 bg-[#171722] px-3 py-2.5 text-sm text-white/80 outline-none focus:border-violet-400/60"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </select>

            <button
              className={secondaryButton}
              onClick={loadTemplate}
              disabled={!templateName}
            >
              Load
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <label className="block space-y-2 text-sm text-white/65">
              Prompt title
              <input
                className={inputClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. React Code Assistant"
                maxLength={100}
              />
            </label>

            <label className="block space-y-2 text-sm text-white/65">
              Category
              <select
                className={inputClass}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-[#171722]"
                  >
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm text-white/65">
            Your prompt
            <textarea
              className={`${inputClass} min-h-52 resize-y leading-7`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe what you want the AI to do..."
            />
          </label>

          <div className="flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center">
            <span className="text-xs text-white/35">
              {prompt.length} characters
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                className={secondaryButton}
                onClick={() => {
                  setTitle("");
                  setCategory("General");
                  setPrompt("");
                  setImprovedPrompt("");
                  setError("");
                  setNotice("");
                }}
              >
                Clear
              </button>

              <button
                className={secondaryButton}
                onClick={savePrompt}
              >
                Save prompt
              </button>

              <button
                className={primaryButton}
                onClick={improveWithAI}
                disabled={isImproving || !prompt.trim()}
              >
                {isImproving ? "Improving..." : "Improve with AI"}
              </button>
            </div>
          </div>
        </div>

        {improvedPrompt && (
          <div className="mt-7 border-t border-white/[0.08] pt-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold">Improved prompt</h3>
                <p className="mt-1 text-xs text-white/40">
                  Review the result before using or saving it.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className={secondaryButton}
                  onClick={() => copyPrompt(improvedPrompt)}
                >
                  Copy
                </button>
                <button
                  className={primaryButton}
                  onClick={() => {
                    setPrompt(improvedPrompt);
                    setImprovedPrompt("");
                    setNotice("Improved prompt moved into the editor.");
                  }}
                >
                  Use this prompt
                </button>
              </div>
            </div>

            <textarea
              aria-label="Improved prompt result"
              className={`${inputClass} mt-4 min-h-48 resize-y leading-7`}
              value={improvedPrompt}
              onChange={(event) => setImprovedPrompt(event.target.value)}
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold">Saved prompts</h2>
            <p className="mt-1 text-sm text-white/40">
              Your personal prompt collection, stored in this browser.
            </p>
          </div>

          {savedPrompts.length > 0 && (
            <input
              aria-label="Search saved prompts"
              className={`${inputClass} sm:max-w-xs`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search prompts..."
            />
          )}
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
            <p className="font-medium text-white/75">
              {savedPrompts.length === 0
                ? "No saved prompts yet"
                : "No prompts match your search"}
            </p>
            <p className="mt-2 text-sm text-white/40">
              {savedPrompts.length === 0
                ? "Your saved prompts will appear here."
                : "Try searching with another title or keyword."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrompts.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-white/[0.08] bg-[#101019]/60 p-4 transition hover:border-violet-400/20 sm:p-5"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <span className="rounded-md border border-violet-300/15 bg-violet-300/[0.05] px-2 py-0.5 text-xs text-violet-200/80">
                        {item.category}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/50">
                      {item.prompt}
                    </p>

                    <p className="mt-3 text-xs text-white/30">
                      Saved {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      className={secondaryButton}
                      onClick={() => editPrompt(item)}
                    >
                      Edit
                    </button>

                    <button
                      className={secondaryButton}
                      onClick={() => copyPrompt(item.prompt)}
                    >
                      Copy
                    </button>

                    <button
                      className="rounded-xl border border-red-400/15 px-3 py-2 text-sm text-red-300/80 transition hover:bg-red-400/[0.06]"
                      onClick={() => deletePrompt(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/[0.07] pt-4 text-xs text-white/30">
        NEXUS CORE · PROMPT ENGINEER
      </footer>
    </main>
  );
}
