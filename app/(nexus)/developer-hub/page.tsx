
"use client";

import { useEffect, useState } from "react";

type Snippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: number;
};

type ToolTab = "helper" | "commands" | "snippets";

const STORAGE_KEY = "nexus-developer-snippets";

const commands = [
  {
    category: "Git",
    name: "Check repository status",
    command: "git status",
    description: "See changed and untracked files.",
  },
  {
    category: "Git",
    name: "Stage all changes",
    command: "git add .",
    description: "Prepare changes for a commit.",
  },
  {
    category: "Git",
    name: "Commit changes",
    command: 'git commit -m "your message"',
    description: "Create a commit with a message.",
  },
  {
    category: "Git",
    name: "View recent commits",
    command: "git log --oneline -5",
    description: "Show the five latest commits.",
  },
  {
    category: "npm",
    name: "Install dependencies",
    command: "npm install",
    description: "Install packages from package.json.",
  },
  {
    category: "npm",
    name: "Start development server",
    command: "npm run dev",
    description: "Run the local development server.",
  },
  {
    category: "npm",
    name: "Build the project",
    command: "npm run build",
    description: "Create a production build.",
  },
  {
    category: "Next.js",
    name: "Check TypeScript",
    command: "npx tsc --noEmit",
    description: "Check TypeScript errors without emitting files.",
  },
];

const helperModes = [
  {
    label: "Explain code",
    value: "Explain the code clearly, step by step, in beginner-friendly language.",
  },
  {
    label: "Find bugs",
    value: "Inspect the code for bugs, errors, and edge cases. Explain the problems and provide corrected code where possible.",
  },
  {
    label: "Improve code",
    value: "Review the code for readability, maintainability, performance, and good practices. Suggest practical improvements.",
  },
];

const templates = [
  {
    label: "React component",
    value: "Help me build a reusable React component. Explain its props, state, and implementation.",
  },
  {
    label: "API debugging",
    value: "Help me debug this API request. Check the request, response, error handling, and likely causes.",
  },
  {
    label: "SQL query",
    value: "Help me write or improve an SQL query. Explain the query and its expected output.",
  },
];

export default function DeveloperHubPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("helper");
  const [helperMode, setHelperMode] = useState(helperModes[0].value);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [snippetsLoaded, setSnippetsLoaded] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetLanguage, setSnippetLanguage] = useState("TypeScript");
  const [snippetCode, setSnippetCode] = useState("");
  const [snippetSearch, setSnippetSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSnippets(parsed as Snippet[]);
        }
      }
    } catch {
      setNotice("Saved snippets could not be loaded.");
    } finally {
      setSnippetsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!snippetsLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
    } catch {
      setNotice("Browser storage is full. Some changes may not be saved.");
    }
  }, [snippets, snippetsLoaded]);

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied to clipboard.");
    } catch {
      setNotice("Copy failed. Please select and copy the text manually.");
    }
  }

  async function runCodeHelper() {
    if (!code.trim()) {
      setError("Paste some code or describe the problem first.");
      return;
    }

    setLoading(true);
    setError("");
    setAiResult("");
    setNotice("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                "You are a helpful programming assistant inside NEXUS Developer Hub.",
                `Programming language: ${language}`,
                helperMode,
                "Be accurate and practical. Use code blocks when useful.",
                "If information is missing, state your assumptions instead of inventing details.",
                "Here is the user's code or question:",
                code,
              ].join("\n\n"),
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The AI request failed. Please try again."
        );
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      setAiResult(data.reply);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Check that your local AI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function saveSnippet() {
    if (!snippetTitle.trim() || !snippetCode.trim()) {
      setNotice("Enter a snippet title and some code first.");
      return;
    }

    if (editingId) {
      setSnippets((current) =>
        current.map((snippet) =>
          snippet.id === editingId
            ? {
                ...snippet,
                title: snippetTitle.trim(),
                language: snippetLanguage,
                code: snippetCode,
              }
            : snippet
        )
      );
      setNotice("Snippet updated.");
    } else {
      setSnippets((current) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: snippetTitle.trim(),
          language: snippetLanguage,
          code: snippetCode,
          createdAt: Date.now(),
        },
        ...current,
      ]);
      setNotice("Snippet saved.");
    }

    setSnippetTitle("");
    setSnippetLanguage("TypeScript");
    setSnippetCode("");
    setEditingId(null);
  }

  function editSnippet(snippet: Snippet) {
    setSnippetTitle(snippet.title);
    setSnippetLanguage(snippet.language);
    setSnippetCode(snippet.code);
    setEditingId(snippet.id);
    setActiveTab("snippets");
    setNotice("");
  }

  const filteredSnippets = snippets.filter((snippet) =>
    `${snippet.title} ${snippet.language} ${snippet.code}`
      .toLowerCase()
      .includes(snippetSearch.toLowerCase())
  );

  const tabs: { id: ToolTab; label: string; description: string }[] = [
    {
      id: "helper",
      label: "Code Helper",
      description: "Understand, debug, and improve code",
    },
    {
      id: "commands",
      label: "Command Reference",
      description: "Useful commands in one place",
    },
    {
      id: "snippets",
      label: "Code Snippets",
      description: "Save and reuse your code",
    },
  ];

  return (
    <main className="min-h-screen bg-[#08090d] px-4 py-8 text-white sm:px-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-violet-300">
            NEXUS / WORKSPACE
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Developer Hub
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
            Your everyday development tools, code assistant, and reusable
            snippets — together in one workspace.
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs text-white/45">
            <span className="rounded-full border border-white/10 px-3 py-1.5">
              {snippets.length} saved snippets
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">
              Local AI integration
            </span>
          </div>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70"
          >
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              className="text-white/50 hover:text-white"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <nav
          aria-label="Developer tools"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                activeTab === tab.id
                  ? "border-violet-400/40 bg-violet-400/[0.09]"
                  : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
              }`}
            >
              <span className="block text-sm font-medium">{tab.label}</span>
              <span className="mt-1 block text-xs leading-5 text-white/45">
                {tab.description}
              </span>
            </button>
          ))}
        </nav>

        {activeTab === "helper" && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Code Helper</h2>
              <p className="mt-1 text-sm text-white/45">
                Ask your local AI to explain code, find bugs, or suggest
                improvements.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="helper-mode"
                  className="mb-2 block text-sm text-white/70"
                >
                  What do you want help with?
                </label>
                <select
                  id="helper-mode"
                  value={helperMode}
                  onChange={(event) => setHelperMode(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111219] px-3 py-3 text-sm outline-none focus:border-violet-400/50"
                >
                  {helperModes.map((mode) => (
                    <option key={mode.label} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                <div>
                  <label
                    htmlFor="helper-language"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Language
                  </label>
                  <select
                    id="helper-language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#111219] px-3 py-3 text-sm outline-none focus:border-violet-400/50"
                  >
                    {[
                      "TypeScript",
                      "JavaScript",
                      "Python",
                      "Java",
                      "C",
                      "C++",
                      "HTML/CSS",
                      "SQL",
                      "Other",
                    ].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="helper-template"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Start with a template
                  </label>
                  <select
                    id="helper-template"
                    defaultValue=""
                    onChange={(event) => {
                      const template = templates.find(
                        (item) => item.label === event.target.value
                      );
                      if (template) setCode(template.value);
                      event.target.value = "";
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#111219] px-3 py-3 text-sm outline-none focus:border-violet-400/50"
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((template) => (
                      <option key={template.label} value={template.label}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="helper-code"
                  className="mb-2 block text-sm text-white/70"
                >
                  Your code or question
                </label>
                <textarea
                  id="helper-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={"Paste your code here...\n\nOr describe the problem you're trying to solve."}
                  rows={9}
                  spellCheck={false}
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0c0d12] p-4 font-mono text-sm leading-6 text-white/85 outline-none placeholder:text-white/25 focus:border-violet-400/50"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-300"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runCodeHelper}
                  disabled={loading}
                  className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-medium transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Working..." : "Run Code Helper"}
                </button>
                <button
                  onClick={() => {
                    setCode("");
                    setAiResult("");
                    setError("");
                  }}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Clear
                </button>
              </div>

              {loading && (
                <p className="text-sm text-white/45">
                  Waiting for your local AI model...
                </p>
              )}

              {aiResult && (
                <div className="space-y-3 border-t border-white/10 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-medium">AI Response</h3>
                    <button
                      onClick={() => copyText(aiResult)}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/[0.05]"
                    >
                      Copy response
                    </button>
                  </div>
                  <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-[#0c0d12] p-4 font-sans text-sm leading-7 text-white/80">
                    {aiResult}
                  </pre>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "commands" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Command Reference</h2>
              <p className="mt-1 text-sm text-white/45">
                Common commands for everyday development.
              </p>
            </div>

            {["Git", "npm", "Next.js"].map((category) => {
              const items = commands.filter(
                (item) => item.category === category
              );

              return (
                <div
                  key={category}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <h3 className="text-sm font-medium">{category}</h3>
                  </div>

                  <div className="divide-y divide-white/[0.07]">
                    {items.map((item) => (
                      <div
                        key={item.name}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="mt-1 text-xs leading-5 text-white/45">
                            {item.description}
                          </p>
                          <code className="mt-2 block break-all text-xs text-violet-200">
                            {item.command}
                          </code>
                        </div>
                        <button
                          onClick={() => copyText(item.command)}
                          className="shrink-0 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.05] sm:self-center"
                        >
                          Copy command
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <p className="text-xs leading-5 text-white/35">
              Review commands before running them. Git commands can change your
              repository, and project scripts depend on your configuration.
            </p>
          </section>
        )}

        {activeTab === "snippets" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Code Snippets</h2>
              <p className="mt-1 text-sm text-white/45">
                Keep useful code close at hand. Snippets are stored in this
                browser on this device.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <h3 className="mb-5 text-sm font-medium">
                {editingId ? "Edit snippet" : "Add a snippet"}
              </h3>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="snippet-title"
                      className="mb-2 block text-sm text-white/70"
                    >
                      Title
                    </label>
                    <input
                      id="snippet-title"
                      value={snippetTitle}
                      onChange={(event) => setSnippetTitle(event.target.value)}
                      placeholder="e.g. React useEffect"
                      className="w-full rounded-xl border border-white/10 bg-[#0c0d12] px-3 py-3 text-sm outline-none focus:border-violet-400/50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="snippet-language"
                      className="mb-2 block text-sm text-white/70"
                    >
                      Language
                    </label>
                    <select
                      id="snippet-language"
                      value={snippetLanguage}
                      onChange={(event) =>
                        setSnippetLanguage(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#0c0d12] px-3 py-3 text-sm outline-none focus:border-violet-400/50"
                    >
                      {[
                        "TypeScript",
                        "JavaScript",
                        "Python",
                        "Java",
                        "C",
                        "C++",
                        "HTML",
                        "CSS",
                        "SQL",
                        "Bash",
                        "Other",
                      ].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="snippet-code"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Code
                  </label>
                  <textarea
                    id="snippet-code"
                    value={snippetCode}
                    onChange={(event) => setSnippetCode(event.target.value)}
                    placeholder="Paste your reusable code here..."
                    rows={7}
                    spellCheck={false}
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#0c0d12] p-4 font-mono text-sm leading-6 outline-none placeholder:text-white/25 focus:border-violet-400/50"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveSnippet}
                    className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-medium hover:bg-violet-400"
                  >
                    {editingId ? "Update snippet" : "Save snippet"}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setSnippetTitle("");
                        setSnippetLanguage("TypeScript");
                        setSnippetCode("");
                      }}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/65 hover:bg-white/[0.05]"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-medium">
                  Your snippets ({filteredSnippets.length})
                </h3>
                <input
                  value={snippetSearch}
                  onChange={(event) => setSnippetSearch(event.target.value)}
                  placeholder="Search snippets..."
                  aria-label="Search saved snippets"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5 text-sm outline-none focus:border-violet-400/50 sm:max-w-xs"
                />
              </div>

              {filteredSnippets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
                  <p className="text-sm text-white/65">
                    {snippets.length === 0
                      ? "No snippets saved yet."
                      : "No snippets match your search."}
                  </p>
                  <p className="mt-2 text-xs text-white/35">
                    {snippets.length === 0
                      ? "Add your first snippet using the form above."
                      : "Try a different title, language, or keyword."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredSnippets.map((snippet) => (
                    <article
                      key={snippet.id}
                      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words text-sm font-medium">
                            {snippet.title}
                          </h4>
                          <p className="mt-1 text-xs text-white/40">
                            {snippet.language}
                          </p>
                        </div>
                        <button
                          onClick={() => copyText(snippet.code)}
                          className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/[0.05]"
                        >
                          Copy
                        </button>
                      </div>

                      <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#0c0d12] p-3 font-mono text-xs leading-5 text-white/65">
                        {snippet.code}
                      </pre>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                        <span className="text-xs text-white/30">
                          {new Date(snippet.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => editSnippet(snippet)}
                            className="text-xs text-white/60 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete "${snippet.title}"?`
                                )
                              ) {
                                setSnippets((current) =>
                                  current.filter(
                                    (item) => item.id !== snippet.id
                                  )
                                );
                                if (editingId === snippet.id) {
                                  setEditingId(null);
                                  setSnippetTitle("");
                                  setSnippetCode("");
                                }
                                setNotice("Snippet deleted.");
                              }
                            }}
                            className="text-xs text-red-300/70 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="border-t border-white/[0.07] pt-5 text-xs leading-5 text-white/30">
          NEXUS CORE · DEVELOPER WORKSPACE
        </footer>
      </div>
    </main>
  );
}
