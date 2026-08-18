"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TechBackground } from "@/components/ui/tech-background";
import { CalendarDays, Sparkles } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Authorizing your session...");
  const [error, setError] = useState("");
  const hasHandled = useRef(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    async function handleAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const idToken = hashParams.get("id_token") || urlParams.get("id_token");
        const accessToken = hashParams.get("access_token");
        const code = urlParams.get("code");

        // 1. GitHub Code Callback
        if (code) {
          setStatus("Authorizing with GitHub...");
          const ghRes = await fetch(`${API_BASE}/auth/github/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });

          const authData = await ghRes.json();
          if (ghRes.ok) {
            localStorage.setItem("access_token", authData.access_token);
            localStorage.setItem("user", JSON.stringify(authData.user));
            window.location.replace("/dashboard");
            return;
          } else {
            throw new Error(authData.detail || "GitHub authorization failed");
          }
        }

        // 2. Google id_token Callback
        if (idToken) {
          setStatus("Authorizing with Google...");
          const base64Url = idToken.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const data = JSON.parse(jsonPayload);

          const res = await fetch(`${API_BASE}/auth/oauth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "google",
              email: data.email,
              name: data.name || data.email.split("@")[0],
            }),
          });

          const authData = await res.json();
          if (res.ok) {
            localStorage.setItem("access_token", authData.access_token);
            localStorage.setItem("user", JSON.stringify(authData.user));
            window.location.replace("/dashboard");
            return;
          } else {
            throw new Error(authData.detail || "Google authorization failed");
          }
        }

        // 3. Google access_token Callback
        if (accessToken) {
          setStatus("Authorizing with Google...");
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (userInfoRes.ok) {
            const userInfo = await userInfoRes.json();

            const res = await fetch(`${API_BASE}/auth/oauth`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider: "google",
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split("@")[0],
              }),
            });

            const authData = await res.json();
            if (res.ok) {
              localStorage.setItem("access_token", authData.access_token);
              localStorage.setItem("user", JSON.stringify(authData.user));
              window.location.replace("/dashboard");
              return;
            }
          }
        }

        // Fallback
        window.location.replace("/dashboard");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to complete authentication.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    }

    handleAuth();
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 overflow-hidden">
      <TechBackground />
      <div className="relative z-10 text-center max-w-sm rounded-3xl border border-border bg-card/85 backdrop-blur-2xl p-8 shadow-xl tt-animate-pop">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md animate-pulse">
          <CalendarDays className="size-7" />
        </div>
        <div className="relative mx-auto size-8 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <h2 className="text-base font-bold text-foreground">
          {error ? error : status}
        </h2>
        <p className="text-xs text-muted-foreground mt-1.5">Establishing encrypted session with TIMETT...</p>
      </div>
    </main>
  );
}
