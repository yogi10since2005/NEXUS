
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Atom,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthPageProps = {
  mode: "login" | "signup";
};

export default function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const isSignup = mode === "signup";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("error");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (isSignup && password !== confirmPassword) {
      setNotice("Your passwords do not match.");
      setNoticeType("error");
      return;
    }

    if (password.length < 8) {
      setNotice("Your password must contain at least 8 characters.");
      setNoticeType("error");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setNotice("Your NEXUS account has been created successfully!");
          setNoticeType("success");

          router.push("/");
          router.refresh();
        } else {
          setNotice(
            "Account created! Please check your email and click the confirmation link before signing in."
          );
          setNoticeType("success");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        setNotice("Login successful! Welcome back to NEXUS.");
        setNoticeType("success");

        router.push("/");
        router.refresh();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setNotice(message);
      setNoticeType("error");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/10";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08070D] text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-violet-700/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-purple-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300">
              <Atom size={24} />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-[0.22em]">
                NEXUS
              </span>
              <span className="block text-[9px] tracking-[0.2em] text-zinc-500">
                PERSONAL COMMAND CENTER
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] tracking-wider text-emerald-300">
              SYSTEM ONLINE
            </span>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20">
          <section className="hidden lg:block">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-2">
              <Sparkles size={14} className="text-violet-300" />
              <span className="text-[10px] tracking-[0.18em] text-violet-200">
                YOUR SPACE. YOUR RULES.
              </span>
            </div>

            <h1 className="text-6xl font-semibold leading-[1.12] tracking-tight">
              Enter your
              <br />
              next{" "}
              <span className="bg-gradient-to-r from-violet-300 via-purple-400 to-fuchsia-300 bg-clip-text text-transparent">
                dimension.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
              Your personal command center for ideas, focus, creativity and
              everything you are building.
            </p>

            <div className="mt-12 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">NEXUS CORE</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Personal workspace environment
                    </p>
                  </div>
                </div>
                <span className="rounded-md border border-emerald-400/20 px-2 py-1 text-[9px] text-emerald-300">
                  READY
                </span>
              </div>

              <div className="my-5 h-px bg-white/[0.08]" />

              <div className="grid grid-cols-3 gap-3">
                {[
                  ["01", "FOCUS"],
                  ["02", "CREATE"],
                  ["03", "BUILD"],
                ].map(([number, label]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-black/20 p-3"
                  >
                    <p className="text-lg font-semibold text-violet-300">
                      {number}
                    </p>
                    <p className="mt-1 text-[9px] tracking-widest text-zinc-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-7 flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck size={15} className="text-violet-300" />
              Your workspace. Your next move.
            </p>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-7 text-center lg:hidden">
              <p className="text-xs tracking-[0.2em] text-violet-300">
                YOUR SPACE. YOUR RULES.
              </p>
              <h1 className="mt-3 text-3xl font-semibold">
                Enter your{" "}
                <span className="text-violet-300">next dimension.</span>
              </h1>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#100D18]/90 p-6 shadow-[0_25px_100px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                  {isSignup ? (
                    <Fingerprint size={24} />
                  ) : (
                    <LockKeyhole size={23} />
                  )}
                </div>

                <p className="mb-2 text-[10px] tracking-[0.22em] text-violet-300">
                  {isSignup ? "CREATE YOUR ACCOUNT" : "SECURE ACCESS"}
                </p>
                <h2 className="text-3xl font-semibold tracking-tight">
                  {isSignup ? "Join NEXUS." : "Welcome back."}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {isSignup
                    ? "Create your account and start building your space."
                    : "Sign in to continue to your personal workspace."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignup && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs text-zinc-300">
                      Display name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                      placeholder="What should we call you?"
                      required
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs text-zinc-300">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      minLength={8}
                      placeholder={
                        isSignup
                          ? "Create a strong password"
                          : "Enter your password"
                      }
                      required
                      className={`${inputClass} pl-11 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {isSignup && (
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs text-zinc-300"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        minLength={8}
                        placeholder="Enter your password again"
                        required
                        className={`${inputClass} pl-11 pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-white"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {!isSignup && (
                  <label className="flex cursor-pointer items-center gap-2.5 text-xs text-zinc-400">
                    <input type="checkbox" className="accent-violet-500" />
                    Keep me signed in on this device
                  </label>
                )}

                {notice && (
                  <p
                    role="status"
                    className={`rounded-xl border px-3 py-3 text-xs leading-5 ${
                      noticeType === "success"
                        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                        : "border-red-400/20 bg-red-500/10 text-red-200"
                    }`}
                  >
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#100D18] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : isSignup
                      ? "Create account"
                      : "Access NEXUS"}
                  {!loading && (
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[10px] tracking-wider text-zinc-600">
                  NEXUS CORE
                </span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <p className="text-center text-sm text-zinc-400">
                {isSignup ? "Already have an account?" : "New to NEXUS?"}{" "}
                <Link
                  href={isSignup ? "/login" : "/signup"}
                  className="font-medium text-violet-300 transition hover:text-violet-200"
                >
                  {isSignup ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] tracking-[0.12em] text-zinc-600">
              <ShieldCheck size={13} />
              <span>NEXUS CORE · PERSONAL COMMAND CENTER</span>
            </div>
          </section>
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] py-5 text-[10px] text-zinc-600 sm:flex-row">
          <span>© {new Date().getFullYear()} NEXUS CORE</span>
          <span>DESIGNED FOR YOUR NEXT DIMENSION</span>
        </footer>
      </div>
    </main>
  );
}