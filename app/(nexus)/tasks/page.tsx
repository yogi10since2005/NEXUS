
"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Plus,
  Trash2,
  Target,
  X,
  AlertCircle,
  Cloud,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  createdAt: string;
};

type DatabaseTask = {
  id: number;
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  created_at: string;
};

const MIGRATION_KEY = "nexus-tasks-migrated-to-supabase";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("PERSONAL");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [showForm, setShowForm] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [legacyTasks, setLegacyTasks] = useState<Task[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const loadTasks = async (active: () => boolean = () => true) => {
    try {
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        if (active()) {
          setCurrentUserId(null);
          setTasks([]);
          setShowImport(false);
          setError("Please sign in to access your NEXUS workspace.");
          setLoading(false);
          setLoaded(true);
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("nexus_tasks")
        .select("id, title, category, priority, completed, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (!active()) return;

      const databaseTasks = (data || []) as DatabaseTask[];

      setCurrentUserId(user.id);

      setTasks(
        databaseTasks.map((task) => ({
          id: task.id,
          title: task.title,
          category: task.category,
          priority: task.priority,
          completed: task.completed,
          createdAt: task.created_at,
        }))
      );

      // Only offer migration when the account has no tasks
      // and the browser has not already completed its migration.
      if (
        databaseTasks.length === 0 &&
        localStorage.getItem(MIGRATION_KEY) !== "true"
      ) {
        try {
          const savedTasks = localStorage.getItem("nexus-tasks");
          const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

          if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
            setLegacyTasks(parsedTasks);
            setShowImport(true);
          } else {
            setShowImport(false);
          }
        } catch {
          setShowImport(false);
        }
      } else {
        setShowImport(false);

        if (databaseTasks.length > 0) {
          localStorage.setItem(MIGRATION_KEY, "true");
        }
      }

      setLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error("NEXUS task loading error:", err);

      if (active()) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your tasks from Supabase."
        );
        setLoading(false);
        setLoaded(true);
      }
    }
  };

  useEffect(() => {
    let active = true;

    const isActive = () => active;

    void loadTasks(isActive);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        setLoading(true);
        void loadTasks(isActive);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // Supabase client is created once for this page instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importExistingTasks = async () => {
    if (!currentUserId || importing || legacyTasks.length === 0) return;

    const confirmed = window.confirm(
      "Import your existing browser tasks into this signed-in NEXUS account? Only continue if this is the account that owns your existing tasks."
    );

    if (!confirmed) return;

    setImporting(true);
    setError("");

    try {
      // Check again before importing, in case another session
      // has already added tasks to this account.
      const { data: existing, error: checkError } = await supabase
        .from("nexus_tasks")
        .select("id")
        .eq("user_id", currentUserId)
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        throw new Error(
          "This account already has tasks. Import was stopped to prevent duplicates."
        );
      }

      const rows = legacyTasks.map((task) => ({
        user_id: currentUserId,
        id: Number(task.id),
        title: String(task.title || "Untitled task"),
        category: String(task.category || "PERSONAL"),
        priority: ["LOW", "MEDIUM", "HIGH"].includes(task.priority)
          ? task.priority
          : "MEDIUM",
        completed: Boolean(task.completed),
        created_at:
          task.createdAt && !Number.isNaN(Date.parse(task.createdAt))
            ? new Date(task.createdAt).toISOString()
            : new Date().toISOString(),
      }));

      if (
        rows.some(
          (task) => !Number.isSafeInteger(task.id) || task.id <= 0
        )
      ) {
        throw new Error(
          "One or more old task IDs are invalid. Your original data has not been changed."
        );
      }

      const { error: insertError } = await supabase
        .from("nexus_tasks")
        .insert(rows);

      if (insertError) throw insertError;

      localStorage.setItem(MIGRATION_KEY, "true");
      setShowImport(false);
      setLegacyTasks([]);

      await loadTasks();
    } catch (err) {
      console.error("NEXUS task migration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to import your existing tasks."
      );
    } finally {
      setImporting(false);
    }
  };

  const addTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !currentUserId || saving) return;

    setSaving(true);
    setError("");

    const newTask: Task = {
      id: Date.now(),
      title: title.trim(),
      category,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const { error: insertError } = await supabase
        .from("nexus_tasks")
        .insert({
          user_id: currentUserId,
          id: newTask.id,
          title: newTask.title,
          category: newTask.category,
          priority: newTask.priority,
          completed: newTask.completed,
          created_at: newTask.createdAt,
        });

      if (insertError) throw insertError;

      setTasks((currentTasks) => [newTask, ...currentTasks]);
      setTitle("");
      setCategory("PERSONAL");
      setPriority("MEDIUM");
      setShowForm(false);
    } catch (err) {
      console.error("NEXUS task creation error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to create this task."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (id: number) => {
    if (!currentUserId) return;

    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const updatedCompleted = !task.completed;
    setError("");

    const { error: updateError } = await supabase
      .from("nexus_tasks")
      .update({ completed: updatedCompleted })
      .eq("user_id", currentUserId)
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === id
          ? { ...item, completed: updatedCompleted }
          : item
      )
    );
  };

  const deleteTask = async (id: number) => {
    if (!currentUserId) return;

    const { error: deleteError } = await supabase
      .from("nexus_tasks")
      .delete()
      .eq("user_id", currentUserId)
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id)
    );
  };

  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="min-h-screen overflow-hidden bg-[#050509] px-6 py-8 text-white md:px-10 md:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[35%] top-[-220px] h-[500px] w-[650px] rounded-full bg-violet-600/[0.08] blur-[140px]" />
        <div className="absolute bottom-[-250px] left-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px]">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 border-b border-white/[0.06] pb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3 text-[10px] tracking-[0.3em] text-violet-300/60">
              <span className="h-px w-7 bg-violet-400/50" />
              MISSION CONTROL
            </div>

            <h1 className="text-4xl font-semibold tracking-tight">
              Your Tasks
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/35">
              Organize your missions, track progress and complete your daily
              objectives.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            disabled={loading || !currentUserId}
            className="flex items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/[0.09] px-5 py-3 text-xs text-violet-200 transition hover:bg-violet-400/[0.16] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "CLOSE FORM" : "NEW TASK"}
          </button>
        </header>

        {/* Connection Status */}
        <div className="mt-5 flex items-center gap-2 text-[10px] tracking-[0.15em] text-emerald-300/60">
          <Cloud size={14} />
          {loading ? "CONNECTING TO NEXUS CLOUD..." : "SUPABASE CLOUD STORAGE"}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-8 text-center text-sm text-white/40">
            Loading your missions...
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200/80">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Existing Task Import */}
        {!loading && showImport && (
          <section className="mt-6 rounded-2xl border border-violet-300/20 bg-violet-400/[0.06] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-violet-200">
                  <Upload size={16} />
                  Existing tasks detected
                </div>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  We found {legacyTasks.length} tasks in this browser. Import
                  them into your current account to keep your existing work.
                  Your original browser backup will remain untouched.
                </p>
              </div>

              <button
                type="button"
                onClick={importExistingTasks}
                disabled={importing}
                className="shrink-0 rounded-xl border border-violet-300/25 bg-violet-400/[0.12] px-5 py-3 text-xs text-violet-100 transition hover:bg-violet-400/[0.2] disabled:opacity-50"
              >
                {importing ? "IMPORTING..." : "IMPORT MY TASKS"}
              </button>
            </div>
          </section>
        )}

        {!loading && loaded && currentUserId && (
          <>
            {/* Statistics */}
            <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="TOTAL MISSIONS"
                value={tasks.length.toString().padStart(2, "0")}
                detail="All your tasks"
                icon={<Target size={17} />}
              />

              <StatCard
                label="PENDING"
                value={pendingTasks.toString().padStart(2, "0")}
                detail="Tasks remaining"
                icon={<Clock3 size={17} />}
              />

              <StatCard
                label="COMPLETED"
                value={completedTasks.toString().padStart(2, "0")}
                detail={`${progress}% completion rate`}
                icon={<CheckCircle2 size={17} />}
              />
            </section>

            {/* Add Task Form */}
            {showForm && (
              <form
                onSubmit={addTask}
                className="mt-6 rounded-2xl border border-violet-300/[0.14] bg-white/[0.035] p-6 backdrop-blur-xl"
              >
                <p className="text-[10px] tracking-[0.25em] text-violet-300/60">
                  CREATE NEW MISSION
                </p>

                <div className="mt-5">
                  <label className="text-xs text-white/45">Task name</label>

                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter your task..."
                    autoFocus
                    className="mt-2 w-full rounded-xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-violet-300/40"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-white/45">Category</label>

                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#101019] px-4 py-3 text-sm text-white/70 outline-none focus:border-violet-300/40"
                    >
                      <option value="PERSONAL">Personal</option>
                      <option value="COLLEGE">College</option>
                      <option value="PROJECT">Project</option>
                      <option value="NEXUS">NEXUS</option>
                      <option value="DEVELOPMENT">Development</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/45">Priority</label>

                    <select
                      value={priority}
                      onChange={(event) =>
                        setPriority(event.target.value as Task["priority"])
                      }
                      className="mt-2 w-full rounded-xl border border-white/[0.09] bg-[#101019] px-4 py-3 text-sm text-white/70 outline-none focus:border-violet-300/40"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.08] px-5 py-3 text-xs text-emerald-200 transition hover:bg-emerald-400/[0.14] disabled:opacity-50"
                >
                  {saving ? "SAVING..." : "CREATE MISSION"}
                </button>
              </form>
            )}

            {/* Progress */}
            <section className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.25em] text-violet-300/60">
                    DAILY PROGRESS
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Mission completion
                  </h2>
                </div>

                <span className="text-2xl font-semibold text-violet-200">
                  {progress}%
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-violet-400/70 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-white/25">
                Complete your missions to increase your productivity.
              </p>
            </section>

            {/* Task List */}
            <section className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.25em] text-white/25">
                    ACTIVE WORKSPACE
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">All missions</h2>
                </div>

                <span className="text-xs text-white/25">
                  {tasks.length} tasks
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.1] p-12 text-center">
                  <Target className="mx-auto text-white/20" size={30} />
                  <p className="mt-4 text-sm text-white/40">
                    No missions yet.
                  </p>
                  <p className="mt-2 text-xs text-white/20">
                    Create your first task to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl transition hover:border-violet-300/20 hover:bg-white/[0.045]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="shrink-0 text-white/30 transition hover:text-emerald-300"
                        aria-label="Toggle task completion"
                      >
                        {task.completed ? (
                          <CheckCircle2
                            size={23}
                            className="text-emerald-300"
                          />
                        ) : (
                          <Circle size={23} />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${
                            task.completed
                              ? "text-white/25 line-through"
                              : "text-white/75"
                          }`}
                        >
                          {task.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[9px] tracking-[0.15em] text-white/30">
                            {task.category}
                          </span>

                          <span
                            className={`rounded-full border px-2 py-1 text-[9px] tracking-[0.15em] ${
                              task.priority === "HIGH"
                                ? "border-red-400/20 bg-red-400/[0.05] text-red-300/70"
                                : task.priority === "MEDIUM"
                                  ? "border-amber-400/20 bg-amber-400/[0.05] text-amber-300/70"
                                  : "border-white/10 bg-white/[0.03] text-white/30"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="rounded-lg p-2 text-white/20 opacity-100 transition hover:bg-red-400/[0.08] hover:text-red-300 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[9px] tracking-[0.25em] text-white/25">
            {label}
          </p>

          <p className="mt-4 text-2xl font-semibold">{value}</p>

          <p className="mt-1 text-[11px] text-white/30">{detail}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-violet-300/70">
          {icon}
        </div>
      </div>
    </div>
  );
}