"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Authorizing...");
  const [error, setError] = useState("");
  const hasHandled = useRef(false);

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
          const ghRes = await fetch("http://127.0.0.1:8000/auth/github/callback", {
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

          const res = await fetch("http://127.0.0.1:8000/auth/oauth", {
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

            const res = await fetch("http://127.0.0.1:8000/auth/oauth", {
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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="text-center max-w-sm">
        <div className="inline-block size-8 animate-spin rounded-full border-3 border-zinc-900 border-t-transparent mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900">
          {error ? error : status}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">Please wait while we log you into TIMETT...</p>
      </div>
    </main>
  );
}
