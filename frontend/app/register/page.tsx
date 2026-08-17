"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OAuthAccountChooserModal } from "@/components/auth/oauth-modal";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OAuth Modal State
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
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token id_token&scope=${scope}&nonce=${nonce}&prompt=select_account`;
      window.location.href = googleAuthUrl;
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
      const response = await fetch("http://127.0.0.1:8000/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          email: account.email,
          name: account.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `${selectedProvider} registration failed`);
      }

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
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Get started with Timett
          </p>
        </div>

        {/* Social OAuth Buttons */}
        <div className="space-y-2.5 mb-6">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => triggerOAuthFlow("google")}
            disabled={loading || oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white py-2.5 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60 cursor-pointer"
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign up with Google
          </button>

          {/* GitHub Button */}
          <button
            type="button"
            onClick={() => triggerOAuthFlow("github")}
            disabled={loading || oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white py-2.5 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60 cursor-pointer"
          >
            <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign up with GitHub
          </button>

          {/* Apple Button */}
          <button
            type="button"
            onClick={() => triggerOAuthFlow("apple")}
            disabled={loading || oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white py-2.5 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60 cursor-pointer"
          >
            <svg className="size-4 shrink-0 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.92-12-14.53-5.33-8.17-9.58-17.51-12.74-28.02-3.16-10.51-4.74-20.73-4.74-30.65 0-14.53 3.82-26.68 11.45-36.46 7.63-9.78 17.15-14.79 28.56-15.04 4.58 0 9.71 1.25 15.39 3.76 5.68 2.51 9.4 3.81 11.16 3.92 1.34 0 5.09-1.31 11.26-3.92 6.17-2.61 11.44-3.81 15.82-3.6 11.66.57 21.05 4.88 28.18 12.92-10.15 6.18-15.17 14.65-15.07 25.41.1 8.3 3.35 15.39 9.76 21.28 6.41 5.88 14.15 9.17 23.23 9.87-2.12 6.54-4.63 13.06-7.53 19.57zm-27.12-107.5c0 6.64-2.42 12.83-7.25 18.57-4.83 5.74-10.84 9.16-18.04 10.25-.13-1.05-.19-2.07-.19-3.06 0-6.42 2.61-12.63 7.82-18.63 5.21-6 11.48-9.45 18.82-10.35.21 1.05.32 2.12.32 3.22z" />
            </svg>
            Sign up with Apple
          </button>
        </div>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-full border-t border-zinc-200" />
          <span className="absolute bg-white px-3 text-xs uppercase tracking-wider text-zinc-400">
            or register with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Name
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Password
            </label>

            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-900"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Interactive Account Chooser Modal */}
      <OAuthAccountChooserModal
        open={oauthModalOpen}
        onOpenChange={setOauthModalOpen}
        provider={selectedProvider}
        onSelectAccount={handleSelectOAuthAccount}
      />
    </main>
  );
}