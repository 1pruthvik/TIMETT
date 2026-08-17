"use client";

import { useEffect, useRef } from "react";

interface GoogleButtonProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

declare global {
  interface Window {
    google?: any;
  }
}

export function RealGoogleSignInButton({ onSuccess, onError, text = "continue_with" }: GoogleButtonProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    // Load Google Identity Services script if not loaded
    const scriptId = "google-jssdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGoogle();
    }

    function initializeGoogle() {
      if (!window.google?.accounts?.id || !btnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: 384,
        text,
        shape: "rectangular",
        logo_alignment: "left",
      });

      // Prompt One-Tap if desired
      window.google.accounts.id.prompt();
    }

    function handleCredentialResponse(response: any) {
      if (response.credential) {
        onSuccess(response.credential);
      } else if (onError) {
        onError("Google Sign-In failed to return credentials.");
      }
    }
  }, [clientId, onSuccess, onError, text]);

  if (!clientId) return null;

  return <div ref={btnRef} className="w-full flex justify-center" />;
}
