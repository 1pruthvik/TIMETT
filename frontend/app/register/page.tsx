"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OAuthAccountChooserModal } from "@/components/auth/oauth-modal";
import { TechBackground } from "@/components/ui/tech-background";
import { ThemeToggle } from "@/components/theme/theme-provider";
import { CalendarDays, Eye, EyeOff, Sparkles } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://tempus-backend-g36k.onrender.com").replace(/\/$/, "");

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState<"google" | "github" | "apple" | null>(null);
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  function triggerOAuthFlow(provider: "google" | "github" | "apple") {
    if (provider === "google") {
      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        "250112896218-tf8akh71tk49qmpk1jqbsit46rtqhtgo.apps.googleusercontent.com";
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
      const scope = encodeURIComponent("openid profile email");
      const nonce = `timett_${Date.now()}`;
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=${scope}&nonce=${nonce}&prompt=select_account`;
      return;
    }
    if (provider === "github") {
      const clientId =
        process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Ov23liO3QwMM860Ad5OI";
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
      return;
    }
    setSelectedProvider(provider);
    setOauthModalOpen(true);
  }

  async function handleSelectOAuthAccount(account: { email: string; name: string }) {
    if (!selectedProvider) return;
    setOauthLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, email: account.email, name: account.name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `${selectedProvider} registration failed`);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setOauthModalOpen(false);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth sign-up failed");
    } finally {
      setOauthLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Registration failed");
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 sm:px-6 py-12 overflow-hidden bg-background text-foreground transition-colors duration-300">
      <TechBackground />

      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md tt-animate-fade">
        <div className="mb-6 text-center space-y-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0052FF] via-[#0070F3] to-[#38BDF8] text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]">
            <CalendarDays className="size-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="text-xs text-muted-foreground">
            Get started with Tempus college timetable planner
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card/85 backdrop-blur-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => triggerOAuthFlow("google")}
              disabled={loading || oauthLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 py-2.5 px-4 text-sm font-semibold text-foreground transition-all hover:bg-muted/70 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign up with Google
            </button>

            <button
              type="button"
              onClick={() => triggerOAuthFlow("github")}
              disabled={loading || oauthLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 py-2.5 px-4 text-sm font-semibold text-foreground transition-all hover:bg-muted/70 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign up with GitHub
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-border" />
            <span className="absolute bg-card px-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              or register with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Rajesh Kumar"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:bg-muted/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@institution.edu"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:bg-muted/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:bg-muted/50 focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="tt-gradient-btn w-full rounded-xl py-3 text-sm font-bold active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating Account...
                </span>
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <OAuthAccountChooserModal
        open={oauthModalOpen}
        onOpenChange={setOauthModalOpen}
        provider={selectedProvider}
        onSelectAccount={handleSelectOAuthAccount}
      />
    </main>
  );
}