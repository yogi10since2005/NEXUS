"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  FileText,
  Heart,
  Keyboard,
  Lightbulb,
  Link2,
  Moon,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type TextSize = "SMALL" | "MEDIUM" | "LARGE" | "HUGE";

type Category =
  | "PERSONAL"
  | "PROJECT"
  | "STUDY"
  | "IDEAS"
  | "WORK";

type BlockType =
  | "TEXT"
  | "CHECKLIST"
  | "CALLOUT"
  | "CODE"
  | "PROGRESS"
  | "TIMER"
  | "LINK"
  | "COLLAPSIBLE";

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type Block = {
  id: string;
  type: BlockType;
  content?: string;
  items?: ChecklistItem[];
  variant?: "IDEA" | "WARNING" | "SUCCESS" | "IMPORTANT" | "QUESTION";
  language?: string;
  progress?: number;
  duration?: number;
  remaining?: number;
  running?: boolean;
  url?: string;
  title?: string;
  collapsed?: boolean;
};

type Note = {
  id: string;
  title: string;
  content: string;
  category: Category;
  pinned: boolean;
  favorite: boolean;
  checklist: boolean;
  checklistItems: ChecklistItem[];
  blocks: Block[];
  textSize: TextSize;
  createdAt: number;
  updatedAt: number;
};

type NoteSettings = {
  textSize: TextSize;
  editorWidth: "COMPACT" | "WIDE" | "FULL";
  lineSpacing: "TIGHT" | "NORMAL" | "RELAXED";
  glassIntensity: "LOW" | "MEDIUM" | "HIGH";
  glow: boolean;
  animations: "OFF" | "LOW" | "HIGH";
  autoSave: boolean;
  restoreLastNote: boolean;
  confirmDelete: boolean;
  experimental: boolean;
  shortcuts: boolean;
  logoHidden: boolean;
};

const STORAGE_KEY = "nexus-notes";
const SETTINGS_KEY = "nexus-notes-settings";
const LOGO_HIDDEN_KEY = "nexus-logo-hidden";

const defaultSettings: NoteSettings = {
  textSize: "MEDIUM",
  editorWidth: "WIDE",
  lineSpacing: "NORMAL",
  glassIntensity: "MEDIUM",
  glow: true,
  animations: "LOW",
  autoSave: true,
  restoreLastNote: true,
  confirmDelete: true,
  experimental: false,
  shortcuts: true,
  logoHidden: false,
};

const categories: ("ALL" | Category)[] = [
  "ALL",
  "PERSONAL",
  "PROJECT",
  "STUDY",
  "IDEAS",
  "WORK",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createTextBlock(content = ""): Block {
  return {
    id: makeId(),
    type: "TEXT",
    content,
  };
}

function createChecklistBlock(): Block {
  return {
    id: makeId(),
    type: "CHECKLIST",
    items: [
      {
        id: makeId(),
        text: "New checklist item",
        completed: false,
      },
    ],
  };
}

function createCalloutBlock(): Block {
  return {
    id: makeId(),
    type: "CALLOUT",
    variant: "IDEA",
    content: "Write your idea here...",
  };
}

function createCodeBlock(): Block {
  return {
    id: makeId(),
    type: "CODE",
    language: "javascript",
    content: "// Write code here",
  };
}

function createProgressBlock(): Block {
  return {
    id: makeId(),
    type: "PROGRESS",
    progress: 50,
    content: "Project progress",
  };
}

function createTimerBlock(): Block {
  return {
    id: makeId(),
    type: "TIMER",
    duration: 300,
    remaining: 300,
    running: false,
    content: "Focus Timer",
  };
}

function createLinkBlock(): Block {
  return {
    id: makeId(),
    type: "LINK",
    title: "Useful Link",
    url: "https://",
  };
}

function createCollapsibleBlock(): Block {
  return {
    id: makeId(),
    type: "COLLAPSIBLE",
    title: "Collapsible section",
    content: "Hidden content...",
    collapsed: false,
  };
}

function createNote(): Note {
  const now = Date.now();

  return {
    id: makeId(),
    title: "Untitled Note",
    content: "",
    category: "PERSONAL",
    pinned: false,
    favorite: false,
    checklist: false,
    checklistItems: [],
    blocks: [createTextBlock()],
    textSize: "MEDIUM",
    createdAt: now,
    updatedAt: now,
  };
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);

  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ALL" | Category>("ALL");

  const [mobileEditor, setMobileEditor] = useState(false);

  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [advancedUnlocked, setAdvancedUnlocked] = useState(false);
  const [showStorage, setShowStorage] = useState(false);

  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<
    "SAVED" | "SAVING..." | "OFF"
  >("SAVED");

  const [settings, setSettings] =
    useState<NoteSettings>(defaultSettings);

  const [logoHidden, setLogoHidden] = useState(false);

  const logoClicks = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /*
   * LOAD NOTES + SETTINGS
   */
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY);

      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);

        if (Array.isArray(parsed)) {
          const migratedNotes: Note[] = parsed.map((note: any) => {
            let blocks = Array.isArray(note.blocks)
              ? note.blocks
              : [];

            if (blocks.length === 0) {
              blocks = [];

              if (note.content) {
                blocks.push(createTextBlock(note.content));
              }

              if (
                note.checklist &&
                Array.isArray(note.checklistItems)
              ) {
                blocks.push({
                  id: makeId(),
                  type: "CHECKLIST",
                  items: note.checklistItems,
                });
              }

              if (blocks.length === 0) {
                blocks.push(createTextBlock(""));
              }
            }

            return {
              ...note,
              blocks,
              textSize: note.textSize || "MEDIUM",
              pinned: Boolean(note.pinned),
              favorite: Boolean(note.favorite),
              category: note.category || "PERSONAL",
              checklist: Boolean(note.checklist),
              checklistItems: Array.isArray(note.checklistItems)
                ? note.checklistItems
                : [],
            };
          });

          setNotes(migratedNotes);

          const savedActive =
            localStorage.getItem("nexus-notes-active");

          if (
            savedActive &&
            migratedNotes.some((note) => note.id === savedActive)
          ) {
            setActiveNoteId(savedActive);
          } else if (migratedNotes.length > 0) {
            setActiveNoteId(migratedNotes[0].id);
          }
        }
      }

      const savedSettings = localStorage.getItem(SETTINGS_KEY);

      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);

          setSettings({
            ...defaultSettings,
            ...parsedSettings,
          });

          if (parsedSettings.logoHidden) {
            setLogoHidden(true);
          }
        } catch {
          setSettings(defaultSettings);
        }
      }

      /*
       * OLD LOGO HIDE SYSTEM
       *
       * We deliberately recover the logo if the old version
       * left the hidden flag behind.
       *
       * The new system allows the logo to be controlled safely
       * from Preferences.
       */
      const oldLogoHidden =
        localStorage.getItem(LOGO_HIDDEN_KEY);

      if (oldLogoHidden === "true") {
        setLogoHidden(true);
      }
    } catch {
      console.error("Failed to load NEXUS Notes.");
    }

    setNotesLoaded(true);
  }, []);

  /*
   * SAVE NOTES
   */
  useEffect(() => {
    if (!notesLoaded) return;

    if (!settings.autoSave) {
      setSaveState("OFF");
      return;
    }

    setSaveState("SAVING...");

    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(notes)
        );

        if (activeNoteId) {
          localStorage.setItem(
            "nexus-notes-active",
            activeNoteId
          );
        }

        setSaveState("SAVED");
      } catch {
        console.error("Failed to save NEXUS Notes.");
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [notes, activeNoteId, notesLoaded, settings.autoSave]);

  /*
   * SAVE SETTINGS
   */
  useEffect(() => {
    if (!notesLoaded) return;

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  }, [settings, notesLoaded]);

  /*
   * ACTIVE NOTE
   */
  const activeNote = useMemo(() => {
    return notes.find((note) => note.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  /*
   * FILTERED NOTES
   */
  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...notes]
      .filter((note) => {
        const categoryMatch =
          category === "ALL" || note.category === category;

        const searchMatch =
          !query ||
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.blocks.some((block) =>
            JSON.stringify(block)
              .toLowerCase()
              .includes(query)
          );

        return categoryMatch && searchMatch;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        return b.updatedAt - a.updatedAt;
      });
  }, [notes, search, category]);

  /*
   * UPDATE NOTE
   */
  function updateNote(id: string, updates: Partial<Note>) {
    setNotes((current) =>
      current.map((note) =>
        note.id === id
          ? {
              ...note,
              ...updates,
              updatedAt: Date.now(),
            }
          : note
      )
    );
  }

  /*
   * CREATE NOTE
   */
  function createNewNote() {
    const note = createNote();

    setNotes((current) => [note, ...current]);
    setActiveNoteId(note.id);
    setMobileEditor(true);
  }

  /*
   * DELETE NOTE
   */
  function deleteNote(id: string) {
    if (settings.confirmDelete) {
      const confirmed = window.confirm(
        "Delete this note permanently?"
      );

      if (!confirmed) return;
    }

    setNotes((current) => {
      const updated = current.filter(
        (note) => note.id !== id
      );

      if (activeNoteId === id) {
        setActiveNoteId(updated[0]?.id || null);
      }

      return updated;
    });
  }

  /*
   * PIN
   */
  function togglePin(id: string) {
    const note = notes.find((item) => item.id === id);

    if (!note) return;

    updateNote(id, {
      pinned: !note.pinned,
    });
  }

  /*
   * FAVORITE
   */
  function toggleFavorite(id: string) {
    const note = notes.find((item) => item.id === id);

    if (!note) return;

    updateNote(id, {
      favorite: !note.favorite,
    });
  }

  /*
   * TEXT SIZE
   */
  function changeTextSize(size: TextSize) {
    if (!activeNote) return;

    updateNote(activeNote.id, {
      textSize: size,
    });

    setSettings((current) => ({
      ...current,
      textSize: size,
    }));
  }

  /*
   * BLOCK FUNCTIONS
   */
  function addBlock(type: BlockType) {
    if (!activeNote) return;

    let block: Block;

    switch (type) {
      case "TEXT":
        block = createTextBlock();
        break;

      case "CHECKLIST":
        block = createChecklistBlock();
        break;

      case "CALLOUT":
        block = createCalloutBlock();
        break;

      case "CODE":
        block = createCodeBlock();
        break;

      case "PROGRESS":
        block = createProgressBlock();
        break;

      case "TIMER":
        block = createTimerBlock();
        break;

      case "LINK":
        block = createLinkBlock();
        break;

      case "COLLAPSIBLE":
        block = createCollapsibleBlock();
        break;
    }

    updateNote(activeNote.id, {
      blocks: [...activeNote.blocks, block],
    });

    setShowAddBlock(false);
  }

  function updateBlock(
    blockId: string,
    updates: Partial<Block>
  ) {
    if (!activeNote) return;

    const blocks = activeNote.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            ...updates,
          }
        : block
    );

    updateNote(activeNote.id, {
      blocks,
    });
  }

  function deleteBlock(blockId: string) {
    if (!activeNote) return;

    const blocks = activeNote.blocks.filter(
      (block) => block.id !== blockId
    );

    updateNote(activeNote.id, {
      blocks:
        blocks.length > 0
          ? blocks
          : [createTextBlock()],
    });
  }

  /*
   * CHECKLIST
   */
  function addChecklistItem(blockId: string) {
    const block = activeNote?.blocks.find(
      (item) => item.id === blockId
    );

    if (!block) return;

    const items = [
      ...(block.items || []),
      {
        id: makeId(),
        text: "New item",
        completed: false,
      },
    ];

    updateBlock(blockId, {
      items,
    });
  }

  function updateChecklistItem(
    blockId: string,
    itemId: string,
    updates: Partial<ChecklistItem>
  ) {
    const block = activeNote?.blocks.find(
      (item) => item.id === blockId
    );

    if (!block) return;

    const items = (block.items || []).map((item) =>
      item.id === itemId
        ? {
            ...item,
            ...updates,
          }
        : item
    );

    updateBlock(blockId, {
      items,
    });
  }

  function deleteChecklistItem(
    blockId: string,
    itemId: string
  ) {
    const block = activeNote?.blocks.find(
      (item) => item.id === blockId
    );

    if (!block) return;

    updateBlock(blockId, {
      items: (block.items || []).filter(
        (item) => item.id !== itemId
      ),
    });
  }

  /*
   * TIMER
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setNotes((current) =>
        current.map((note) => {
          let changed = false;

          const blocks = note.blocks.map((block) => {
            if (
              block.type !== "TIMER" ||
              !block.running ||
              !block.remaining
            ) {
              return block;
            }

            changed = true;

            const nextRemaining = Math.max(
              0,
              block.remaining - 1
            );

            return {
              ...block,
              remaining: nextRemaining,
              running: nextRemaining > 0,
            };
          });

          return changed
            ? {
                ...note,
                blocks,
                updatedAt: Date.now(),
              }
            : note;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /*
   * SETTINGS
   */
  function updateSettings(
    updates: Partial<NoteSettings>
  ) {
    setSettings((current) => ({
      ...current,
      ...updates,
    }));
  }

  function resetSettings() {
    setSettings(defaultSettings);

    localStorage.removeItem(LOGO_HIDDEN_KEY);

    setLogoHidden(false);
  }

  /*
   * LOGO SYSTEM
   */
  function handleLogoClick() {
    logoClicks.current += 1;

    if (logoClicks.current >= 5) {
      setAdvancedUnlocked(true);
      logoClicks.current = 0;
    }

    setTimeout(() => {
      logoClicks.current = 0;
    }, 1800);
  }

  function hideLogo() {
    localStorage.setItem(LOGO_HIDDEN_KEY, "true");

    setSettings((current) => ({
      ...current,
      logoHidden: true,
    }));

    setLogoHidden(true);
  }

  function restoreLogo() {
    /*
     * Remove BOTH the old hidden key and the new setting.
     */
    localStorage.removeItem(LOGO_HIDDEN_KEY);

    setSettings((current) => ({
      ...current,
      logoHidden: false,
    }));

    setLogoHidden(false);
  }

  /*
   * EXPORT
   */
  function exportNotes() {
    const data = JSON.stringify(notes, null, 2);

    const blob = new Blob([data], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "nexus-notes.json";

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  }

  /*
   * IMPORT
   */
  function importNotes(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(
          String(reader.result)
        );

        if (!Array.isArray(imported)) {
          throw new Error("Invalid file");
        }

        setNotes(imported);

        if (imported.length > 0) {
          setActiveNoteId(imported[0].id);
        }
      } catch {
        alert("This is not a valid NEXUS Notes file.");
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  /*
   * CLEAR ALL
   */
  function clearAllNotes() {
    const confirmed = window.confirm(
      "Delete ALL NEXUS Notes? This cannot be undone."
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("nexus-notes-active");

    setNotes([]);
    setActiveNoteId(null);
  }

  /*
   * COPY
   */
  async function copyNote() {
    if (!activeNote) return;

    const text = [
      `# ${activeNote.title}`,
      "",
      `Category: ${activeNote.category}`,
      "",
      ...activeNote.blocks.map((block) => {
        if (block.type === "TEXT") {
          return block.content || "";
        }

        if (block.type === "CALLOUT") {
          return `[${block.variant}] ${
            block.content || ""
          }`;
        }

        if (block.type === "CODE") {
          return `\`\`\`${block.language || ""}\n${
            block.content || ""
          }\n\`\`\``;
        }

        if (block.type === "CHECKLIST") {
          return (block.items || [])
            .map(
              (item) =>
                `${item.completed ? "☑" : "☐"} ${item.text}`
            )
            .join("\n");
        }

        if (block.type === "PROGRESS") {
          return `${block.content || "Progress"}: ${
            block.progress || 0
          }%`;
        }

        if (block.type === "TIMER") {
          return `${
            block.content || "Timer"
          }: ${formatTime(block.remaining || 0)}`;
        }

        if (block.type === "LINK") {
          return `${block.title || "Link"}: ${
            block.url || ""
          }`;
        }

        if (block.type === "COLLAPSIBLE") {
          return `${block.title || "Section"}\n${
            block.content || ""
          }`;
        }

        return "";
      }),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      alert("Unable to copy note.");
    }
  }

  /*
   * SHARE
   */
  async function shareNote() {
    if (!activeNote) return;

    const text = `${activeNote.title}\n\n${activeNote.blocks
      .map((block) => block.content || "")
      .filter(Boolean)
      .join("\n\n")}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: activeNote.title,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);

        alert(
          "Sharing is not supported here. Note copied instead."
        );
      }
    } catch {
      // User cancelled sharing.
    }
  }

  /*
   * KEYBOARD SHORTCUTS
   */
  useEffect(() => {
    if (!settings.shortcuts) return;

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      /*
       * Ctrl + Shift + N
       * New note
       */
      if (
        event.ctrlKey &&
        event.shiftKey &&
        key === "n"
      ) {
        event.preventDefault();

        createNewNote();

        return;
      }

      /*
       * Ctrl + Alt + P
       * Preferences
       *
       * This avoids the Ctrl + Shift + P printer shortcut.
       */
      if (
        event.ctrlKey &&
        event.altKey &&
        key === "p"
      ) {
        event.preventDefault();

        setShowSettings((current) => !current);

        return;
      }

      /*
       * Escape
       * Close overlays
       */
      if (key === "escape") {
        setShowSettings(false);
        setShowStorage(false);
        setShowAddBlock(false);

        return;
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [settings.shortcuts]);

  /*
   * EMPTY STATE
   */
  if (notesLoaded && notes.length === 0) {
    return (
      <main className="min-h-screen bg-[#050507] text-white">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <FileText className="h-7 w-7 text-white/70" />
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              NEXUS Notes
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
              Your interactive workspace for ideas,
              projects, study notes and everything you
              want to remember.
            </p>

            <button
              onClick={createNewNote}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Create first note
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`${
            mobileEditor ? "hidden md:flex" : "flex"
          } w-full flex-col border-r border-white/10 bg-white/[0.015] md:w-[330px]`}
        >
          <div className="border-b border-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              {!logoHidden ? (
                <button
                  onClick={handleLogoClick}
                  className="text-left"
                  title="Click 5 times to unlock advanced settings"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-white/80" />

                    <h1 className="text-lg font-semibold">
                      NEXUS Notes
                    </h1>
                  </div>

                  <p className="mt-1 text-xs text-white/30">
                    Interactive workspace
                  </p>
                </button>
              ) : (
                <div>
                  <p className="text-xs text-white/20">
                    Logo hidden
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowSettings(true)}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                title="Preferences"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={createNewNote}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              New Note
            </button>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search notes..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/20"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-medium tracking-wide transition ${
                    category === item
                      ? "border-white/20 bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/25">
                No notes found.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      setMobileEditor(true);
                    }}
                    className={`group w-full rounded-2xl border p-4 text-left transition ${
                      activeNoteId === note.id
                        ? "border-white/15 bg-white/[0.07]"
                        : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white/90">
                          {note.title || "Untitled Note"}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/30">
                          {note.blocks
                            .map(
                              (block) =>
                                block.content || ""
                            )
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {note.pinned && (
                          <Pin className="h-3 w-3 text-white/60" />
                        )}

                        {note.favorite && (
                          <Heart className="h-3 w-3 fill-white text-white" />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                        {note.category}
                      </span>

                      <span className="text-[9px] text-white/20">
                        {new Date(
                          note.updatedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* EDITOR */}
        <section
          className={`${
            mobileEditor ? "flex" : "hidden md:flex"
          } min-w-0 flex-1 flex-col`}
        >
          {activeNote ? (
            <>
              {/* TOP BAR */}
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#050507]/90 px-4 py-3 backdrop-blur-xl md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setMobileEditor(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/50 md:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                        {activeNote.category}
                      </span>

                      <span className="text-[9px] text-white/20">
                        •
                      </span>

                      <span className="text-[9px] text-white/30">
                        {settings.autoSave
                          ? saveState
                          : "AUTO-SAVE OFF"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      togglePin(activeNote.id)
                    }
                    className={`rounded-xl p-2 transition ${
                      activeNote.pinned
                        ? "bg-white text-black"
                        : "text-white/40 hover:bg-white/[0.06] hover:text-white"
                    }`}
                    title="Pin"
                  >
                    <Pin className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() =>
                      toggleFavorite(activeNote.id)
                    }
                    className={`rounded-xl p-2 transition ${
                      activeNote.favorite
                        ? "bg-white text-black"
                        : "text-white/40 hover:bg-white/[0.06] hover:text-white"
                    }`}
                    title="Favorite"
                  >
                    <Heart className="h-4 w-4" />
                  </button>

                  <button
                    onClick={copyNote}
                    className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    onClick={shareNote}
                    className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() =>
                      deleteNote(activeNote.id)
                    }
                    className="rounded-xl p-2 text-white/40 transition hover:bg-red-500/10 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* EDITOR CONTENT */}
              <div
                className={`mx-auto w-full flex-1 px-5 py-8 md:px-10 md:py-12 ${
                  settings.editorWidth === "COMPACT"
                    ? "max-w-3xl"
                    : settings.editorWidth === "FULL"
                    ? "max-w-none"
                    : "max-w-5xl"
                }`}
              >
                <input
                  value={activeNote.title}
                  onChange={(event) =>
                    updateNote(activeNote.id, {
                      title: event.target.value,
                    })
                  }
                  placeholder="Untitled Note"
                  className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight text-white outline-none placeholder:text-white/20 md:text-5xl"
                />

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <select
                    value={activeNote.category}
                    onChange={(event) =>
                      updateNote(activeNote.id, {
                        category:
                          event.target.value as Category,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 outline-none"
                  >
                    <option value="PERSONAL">
                      PERSONAL
                    </option>
                    <option value="PROJECT">
                      PROJECT
                    </option>
                    <option value="STUDY">STUDY</option>
                    <option value="IDEAS">IDEAS</option>
                    <option value="WORK">WORK</option>
                  </select>

                  <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    {(
                      ["SMALL", "MEDIUM", "LARGE", "HUGE"] as TextSize[]
                    ).map((size) => (
                      <button
                        key={size}
                        onClick={() =>
                          changeTextSize(size)
                        }
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${
                          activeNote.textSize === size
                            ? "bg-white text-black"
                            : "text-white/40 hover:text-white"
                        }`}
                      >
                        {size === "SMALL"
                          ? "S"
                          : size === "MEDIUM"
                          ? "M"
                          : size === "LARGE"
                          ? "L"
                          : "XL"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  {activeNote.blocks.map((block) => (
                    <BlockEditor
                      key={block.id}
                      block={block}
                      settings={settings}
                      onUpdate={(updates) =>
                        updateBlock(block.id, updates)
                      }
                      onDelete={() =>
                        deleteBlock(block.id)
                      }
                      onAddChecklistItem={() =>
                        addChecklistItem(block.id)
                      }
                      onUpdateChecklistItem={(
                        itemId,
                        updates
                      ) =>
                        updateChecklistItem(
                          block.id,
                          itemId,
                          updates
                        )
                      }
                      onDeleteChecklistItem={(itemId) =>
                        deleteChecklistItem(
                          block.id,
                          itemId
                        )
                      }
                    />
                  ))}
                </div>

                {/* ADD BLOCK */}
                <div className="relative mt-6">
                  <button
                    onClick={() =>
                      setShowAddBlock(
                        (current) => !current
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-white/35 transition hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add Block
                  </button>

                  {showAddBlock && (
                    <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0b0b0e] p-2 shadow-2xl">
                      <AddBlockButton
                        icon={<FileText className="h-4 w-4" />}
                        title="Text"
                        description="Regular text block"
                        onClick={() =>
                          addBlock("TEXT")
                        }
                      />

                      <AddBlockButton
                        icon={
                          <CheckSquare className="h-4 w-4" />
                        }
                        title="Checklist"
                        description="Interactive checklist"
                        onClick={() =>
                          addBlock("CHECKLIST")
                        }
                      />

                      <AddBlockButton
                        icon={
                          <Lightbulb className="h-4 w-4" />
                        }
                        title="Callout"
                        description="Idea or important note"
                        onClick={() =>
                          addBlock("CALLOUT")
                        }
                      />

                      <AddBlockButton
                        icon={<Code2 className="h-4 w-4" />}
                        title="Code"
                        description="Code block"
                        onClick={() =>
                          addBlock("CODE")
                        }
                      />

                      <AddBlockButton
                        icon={
                          <BarChart3 className="h-4 w-4" />
                        }
                        title="Progress"
                        description="Track project progress"
                        onClick={() =>
                          addBlock("PROGRESS")
                        }
                      />

                      <AddBlockButton
                        icon={
                          <Timer className="h-4 w-4" />
                        }
                        title="Timer"
                        description="Interactive countdown"
                        onClick={() =>
                          addBlock("TIMER")
                        }
                      />

                      <AddBlockButton
                        icon={
                          <Link2 className="h-4 w-4" />
                        }
                        title="Link"
                        description="Save a useful URL"
                        onClick={() =>
                          addBlock("LINK")
                        }
                      />

                      <AddBlockButton
                        icon={
                          <ChevronDown className="h-4 w-4" />
                        }
                        title="Collapsible"
                        description="Expandable section"
                        onClick={() =>
                          addBlock("COLLAPSIBLE")
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                    {activeNote.blocks.length} blocks
                  </span>

                  <span className="text-[10px] text-white/20">
                    Updated{" "}
                    {new Date(
                      activeNote.updatedAt
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center">
                <FileText className="mx-auto h-10 w-10 text-white/20" />

                <p className="mt-4 text-sm text-white/40">
                  Select a note to begin.
                </p>

                <button
                  onClick={createNewNote}
                  className="mt-5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black"
                >
                  Create Note
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* SETTINGS OVERLAY */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a0d] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0d]/95 px-6 py-5 backdrop-blur-xl">
              <div>
                <h2 className="text-lg font-semibold">
                  Preferences
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Customize your NEXUS Notes workspace.
                </p>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8 p-6">
              {/* EDITOR */}
              <SettingsSection
                icon={<FileText className="h-4 w-4" />}
                title="Editor"
                description="Control how your notes are displayed."
              >
                <SettingRow
                  title="Editor width"
                  description="Choose the maximum writing width."
                >
                  <SelectControl
                    value={settings.editorWidth}
                    options={[
                      "COMPACT",
                      "WIDE",
                      "FULL",
                    ]}
                    onChange={(value) =>
                      updateSettings({
                        editorWidth:
                          value as NoteSettings["editorWidth"],
                      })
                    }
                  />
                </SettingRow>

                <SettingRow
                  title="Line spacing"
                  description="Adjust text spacing."
                >
                  <SelectControl
                    value={settings.lineSpacing}
                    options={[
                      "TIGHT",
                      "NORMAL",
                      "RELAXED",
                    ]}
                    onChange={(value) =>
                      updateSettings({
                        lineSpacing:
                          value as NoteSettings["lineSpacing"],
                      })
                    }
                  />
                </SettingRow>

                <SettingRow
                  title="Default text size"
                  description="Default size for new notes."
                >
                  <SelectControl
                    value={settings.textSize}
                    options={[
                      "SMALL",
                      "MEDIUM",
                      "LARGE",
                      "HUGE",
                    ]}
                    onChange={(value) =>
                      updateSettings({
                        textSize:
                          value as TextSize,
                      })
                    }
                  />
                </SettingRow>
              </SettingsSection>

              {/* APPEARANCE */}
              <SettingsSection
                icon={<Moon className="h-4 w-4" />}
                title="Appearance"
                description="Customize the visual feel of NEXUS."
              >
                <SettingRow
                  title="Glass intensity"
                  description="Adjust glass transparency."
                >
                  <SelectControl
                    value={settings.glassIntensity}
                    options={[
                      "LOW",
                      "MEDIUM",
                      "HIGH",
                    ]}
                    onChange={(value) =>
                      updateSettings({
                        glassIntensity:
                          value as NoteSettings["glassIntensity"],
                      })
                    }
                  />
                </SettingRow>

                <SettingRow
                  title="Glow effects"
                  description="Enable subtle interface glow."
                >
                  <Toggle
                    checked={settings.glow}
                    onChange={(value) =>
                      updateSettings({
                        glow: value,
                      })
                    }
                  />
                </SettingRow>

                <SettingRow
                  title="Animations"
                  description="Control interface animations."
                >
                  <SelectControl
                    value={settings.animations}
                    options={[
                      "OFF",
                      "LOW",
                      "HIGH",
                    ]}
                    onChange={(value) =>
                      updateSettings({
                        animations:
                          value as NoteSettings["animations"],
                      })
                    }
                  />
                </SettingRow>
              </SettingsSection>

              {/* BEHAVIOR */}
              <SettingsSection
                icon={
                  <RotateCcw className="h-4 w-4" />
                }
                title="Behavior"
                description="Control how Notes behaves."
              >
                <SettingRow
                  title="Auto-save"
                  description="Automatically save changes."
                >
                  <Toggle
                    checked={settings.autoSave}
                    onChange={(value) =>
                      updateSettings({
                        autoSave: value,
                      })
                    }
                  />
                </SettingRow>

                <SettingRow
                  title="Restore last note"
                  description="Open the previous note automatically."
                >
                  <Toggle
                    checked={settings.restoreLastNote}
                    onChange={(value) =>
                      updateSettings({
                        restoreLastNote: value,
                      })
                    }
                  />
                </SettingRow>

                <SettingRow
                  title="Confirm delete"
                  description="Ask before deleting notes."
                >
                  <Toggle
                    checked={settings.confirmDelete}
                    onChange={(value) =>
                      updateSettings({
                        confirmDelete: value,
                      })
                    }
                  />
                </SettingRow>
              </SettingsSection>

              {/* DATA */}
              <SettingsSection
                icon={<Download className="h-4 w-4" />}
                title="Data"
                description="Manage your local Notes data."
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <ActionButton
                    icon={
                      <Download className="h-4 w-4" />
                    }
                    title="Export Notes"
                    onClick={exportNotes}
                  />

                  <ActionButton
                    icon={
                      <Upload className="h-4 w-4" />
                    }
                    title="Import Notes"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  />

                  <ActionButton
                    icon={
                      <BarChart3 className="h-4 w-4" />
                    }
                    title="Storage Viewer"
                    onClick={() =>
                      setShowStorage(true)
                    }
                  />

                  <ActionButton
                    icon={
                      <Trash2 className="h-4 w-4" />
                    }
                    title="Clear All Notes"
                    onClick={clearAllNotes}
                    danger
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={importNotes}
                  className="hidden"
                />
              </SettingsSection>

              {/* ADVANCED */}
              {advancedUnlocked && (
                <SettingsSection
                  icon={
                    <Sparkles className="h-4 w-4" />
                  }
                  title="Advanced"
                  description="Advanced NEXUS workspace controls."
                >
                  {/* RESTORE LOGO */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          NEXUS Logo
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          Restore the NEXUS Notes logo if it
                          was hidden.
                        </p>
                      </div>

                      <button
                        onClick={restoreLogo}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.1]"
                      >
                        Restore Logo
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] leading-5 text-white/30">
                        Logo status:{" "}
                        <span className="text-white/60">
                          {logoHidden
                            ? "Hidden"
                            : "Visible"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* HIDE LOGO */}
                  {!logoHidden && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Hide Logo
                          </p>

                          <p className="mt-1 text-xs leading-5 text-white/35">
                            Hide the NEXUS Notes logo from
                            the sidebar.
                          </p>
                        </div>

                        <button
                          onClick={hideLogo}
                          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.1] hover:text-white"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  )}

                  <SettingRow
                    title="Experimental features"
                    description="Enable experimental workspace features."
                  >
                    <Toggle
                      checked={settings.experimental}
                      onChange={(value) =>
                        updateSettings({
                          experimental: value,
                        })
                      }
                    />
                  </SettingRow>
                </SettingsSection>
              )}

              {/* SHORTCUTS */}
              <SettingsSection
                icon={
                  <Keyboard className="h-4 w-4" />
                }
                title="Keyboard Shortcuts"
                description="Quick controls for NEXUS Notes."
              >
                <SettingRow
                  title="Enable shortcuts"
                  description="Turn keyboard shortcuts on or off."
                >
                  <Toggle
                    checked={settings.shortcuts}
                    onChange={(value) =>
                      updateSettings({
                        shortcuts: value,
                      })
                    }
                  />
                </SettingRow>

                <div className="mt-4 space-y-2">
                  <ShortcutRow
                    keys={["Ctrl", "Shift", "N"]}
                    label="New note"
                  />

                  <ShortcutRow
                    keys={["Ctrl", "Alt", "P"]}
                    label="Open Preferences"
                  />

                  <ShortcutRow
                    keys={["Esc"]}
                    label="Close Preferences"
                  />
                </div>
              </SettingsSection>

              {/* RESET */}
              <button
                onClick={resetSettings}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STORAGE VIEWER */}
      {showStorage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0a0a0d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Storage Viewer
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Local NEXUS Notes data.
                </p>
              </div>

              <button
                onClick={() => setShowStorage(false)}
                className="rounded-xl p-2 text-white/40 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/30 p-5 text-xs leading-6 text-white/50">
                {JSON.stringify(notes, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
 * BLOCK EDITOR
 */

function BlockEditor({
  block,
  settings,
  onUpdate,
  onDelete,
  onAddChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
}: {
  block: Block;
  settings: NoteSettings;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onAddChecklistItem: () => void;
  onUpdateChecklistItem: (
    itemId: string,
    updates: Partial<ChecklistItem>
  ) => void;
  onDeleteChecklistItem: (itemId: string) => void;
}) {
  const textSizeClass =
    settings.textSize === "SMALL"
      ? "text-sm"
      : settings.textSize === "LARGE"
      ? "text-lg"
      : settings.textSize === "HUGE"
      ? "text-xl"
      : "text-base";

  const lineSpacingClass =
    settings.lineSpacing === "TIGHT"
      ? "leading-6"
      : settings.lineSpacing === "RELAXED"
      ? "leading-8"
      : "leading-7";

  const wrapper =
    "group relative rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/15";

  return (
    <div className={wrapper}>
      {/* TEXT */}
      {block.type === "TEXT" && (
        <textarea
          value={block.content || ""}
          onChange={(event) =>
            onUpdate({
              content: event.target.value,
            })
          }
          placeholder="Start writing..."
          rows={4}
          className={`min-h-[110px] w-full resize-y border-none bg-transparent outline-none placeholder:text-white/20 ${textSizeClass} ${lineSpacingClass}`}
        />
      )}

      {/* CHECKLIST */}
      {block.type === "CHECKLIST" && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/50">
            <CheckSquare className="h-4 w-4" />
            Checklist
          </div>

          <div className="space-y-2">
            {(block.items || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3"
              >
                <button
                  onClick={() =>
                    onUpdateChecklistItem(
                      item.id,
                      {
                        completed:
                          !item.completed,
                      }
                    )
                  }
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    item.completed
                      ? "border-white bg-white text-black"
                      : "border-white/20 bg-white/[0.03]"
                  }`}
                >
                  {item.completed && (
                    <Check className="h-3 w-3" />
                  )}
                </button>

                <input
                  value={item.text}
                  onChange={(event) =>
                    onUpdateChecklistItem(
                      item.id,
                      {
                        text: event.target.value,
                      }
                    )
                  }
                  className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                    item.completed
                      ? "text-white/30 line-through"
                      : "text-white/80"
                  }`}
                />

                <button
                  onClick={() =>
                    onDeleteChecklistItem(item.id)
                  }
                  className="rounded-lg p-1 text-white/20 opacity-0 transition hover:text-white group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={onAddChecklistItem}
            className="mt-4 flex items-center gap-2 text-xs text-white/30 transition hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </button>
        </div>
      )}

      {/* CALLOUT */}
      {block.type === "CALLOUT" && (
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-white/50" />

            <select
              value={block.variant || "IDEA"}
              onChange={(event) =>
                onUpdate({
                  variant:
                    event.target.value as Block["variant"],
                })
              }
              className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/60 outline-none"
            >
              <option value="IDEA">IDEA</option>
              <option value="WARNING">WARNING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="IMPORTANT">
                IMPORTANT
              </option>
              <option value="QUESTION">
                QUESTION
              </option>
            </select>
          </div>

          <textarea
            value={block.content || ""}
            onChange={(event) =>
              onUpdate({
                content: event.target.value,
              })
            }
            rows={4}
            className="mt-3 w-full resize-y bg-transparent text-sm leading-7 text-white/70 outline-none placeholder:text-white/20"
            placeholder="Write your callout..."
          />
        </div>
      )}

      {/* CODE */}
      {block.type === "CODE" && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Code2 className="h-4 w-4" />
              Code
            </div>

            <select
              value={block.language || "javascript"}
              onChange={(event) =>
                onUpdate({
                  language: event.target.value,
                })
              }
              className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white/50 outline-none"
            >
              <option value="javascript">
                JavaScript
              </option>
              <option value="typescript">
                TypeScript
              </option>
              <option value="tsx">TSX</option>
              <option value="jsx">JSX</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="sql">SQL</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="bash">Bash</option>
            </select>
          </div>

          <textarea
            value={block.content || ""}
            onChange={(event) =>
              onUpdate({
                content: event.target.value,
              })
            }
            rows={10}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-6 text-white/70 outline-none placeholder:text-white/20"
            placeholder="// Write code..."
          />
        </div>
      )}

      {/* PROGRESS */}
      {block.type === "PROGRESS" && (
        <div>
          <div className="flex items-center justify-between">
            <input
              value={block.content || ""}
              onChange={(event) =>
                onUpdate({
                  content: event.target.value,
                })
              }
              className="bg-transparent text-sm font-medium text-white/70 outline-none"
              placeholder="Project progress"
            />

            <span className="text-xs text-white/40">
              {block.progress || 0}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={block.progress || 0}
            onChange={(event) =>
              onUpdate({
                progress: Number(event.target.value),
              })
            }
            className="mt-5 w-full"
          />

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${block.progress || 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* TIMER */}
      {block.type === "TIMER" && (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-white/50" />

              <input
                value={block.content || ""}
                onChange={(event) =>
                  onUpdate({
                    content: event.target.value,
                  })
                }
                className="bg-transparent text-sm font-medium text-white/70 outline-none"
                placeholder="Focus Timer"
              />
            </div>

            <span className="font-mono text-lg text-white/80">
              {formatTime(block.remaining || 0)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() =>
                onUpdate({
                  running: !block.running,
                })
              }
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs text-white/60 hover:bg-white/[0.1] hover:text-white"
            >
              {block.running ? "Pause" : "Start"}
            </button>

            <button
              onClick={() =>
                onUpdate({
                  remaining: block.duration || 300,
                  running: false,
                })
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/40 hover:text-white"
            >
              Reset
            </button>

            <select
              value={block.duration || 300}
              onChange={(event) => {
                const duration = Number(
                  event.target.value
                );

                onUpdate({
                  duration,
                  remaining: duration,
                  running: false,
                });
              }}
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/50 outline-none"
            >
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
              <option value="900">15 minutes</option>
              <option value="1500">25 minutes</option>
              <option value="1800">30 minutes</option>
              <option value="3600">60 minutes</option>
            </select>
          </div>
        </div>
      )}

      {/* LINK */}
      {block.type === "LINK" && (
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-white/50" />

            <input
              value={block.title || ""}
              onChange={(event) =>
                onUpdate({
                  title: event.target.value,
                })
              }
              placeholder="Link title"
              className="flex-1 bg-transparent text-sm font-medium text-white/70 outline-none"
            />
          </div>

          <input
            value={block.url || ""}
            onChange={(event) =>
              onUpdate({
                url: event.target.value,
              })
            }
            placeholder="https://example.com"
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/50 outline-none"
          />

          {block.url &&
            block.url !== "https://" && (
              <a
                href={block.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-xs text-white/50 underline underline-offset-4 hover:text-white"
              >
                Open link
                <ChevronRight className="h-3 w-3" />
              </a>
            )}
        </div>
      )}

      {/* COLLAPSIBLE */}
      {block.type === "COLLAPSIBLE" && (
        <div>
          <button
            onClick={() =>
              onUpdate({
                collapsed: !block.collapsed,
              })
            }
            className="flex w-full items-center gap-2 text-left"
          >
            {block.collapsed ? (
              <ChevronRight className="h-4 w-4 text-white/40" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/40" />
            )}

            <input
              value={block.title || ""}
              onChange={(event) => {
                event.stopPropagation();

                onUpdate({
                  title: event.target.value,
                });
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="flex-1 bg-transparent text-sm font-medium text-white/70 outline-none"
              placeholder="Section title"
            />
          </button>

          {!block.collapsed && (
            <textarea
              value={block.content || ""}
              onChange={(event) =>
                onUpdate({
                  content: event.target.value,
                })
              }
              rows={5}
              className="mt-4 w-full resize-y bg-transparent text-sm leading-7 text-white/60 outline-none placeholder:text-white/20"
              placeholder="Write hidden content..."
            />
          )}
        </div>
      )}

      {/* DELETE BLOCK */}
      <button
        onClick={onDelete}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-white/15 opacity-0 transition hover:bg-white/[0.06] hover:text-white group-hover:opacity-100"
        title="Delete block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/*
 * SETTINGS COMPONENTS
 */

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-medium text-white/80">
            {title}
          </h3>

          <p className="mt-1 text-xs text-white/30">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="min-w-0">
        <p className="text-sm text-white/70">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-white/30">
          {description}
        </p>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SelectControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] text-white/60 outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition ${
        checked
          ? "border-white bg-white"
          : "border-white/10 bg-white/[0.05]"
      }`}
      aria-label="Toggle"
    >
      <span
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition ${
          checked
            ? "left-[22px] bg-black"
            : "left-1 bg-white/30"
        }`}
      />
    </button>
  );
}

function ActionButton({
  icon,
  title,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.05] ${
        danger
          ? "text-red-300/60 hover:text-red-300"
          : "text-white/50 hover:text-white"
      }`}
    >
      {icon}

      <span className="text-xs">{title}</span>
    </button>
  );
}

function ShortcutRow({
  keys,
  label,
}: {
  keys: string[];
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <span className="text-xs text-white/40">
        {label}
      </span>

      <div className="flex items-center gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[9px] text-white/50"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function AddBlockButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.06]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50">
        {icon}
      </div>

      <div>
        <p className="text-xs font-medium text-white/70">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-white/25">
          {description}
        </p>
      </div>
    </button>
  );
}