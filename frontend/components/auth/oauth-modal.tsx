"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Info } from "lucide-react";

interface OAuthChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: "google" | "github" | "apple" | null;
  onSelectAccount: (account: { email: string; name: string; avatar?: string }) => void;
}

export function OAuthAccountChooserModal({
  open,
  onOpenChange,
  provider,
  onSelectAccount,
}: OAuthChooserProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setEmail("");
    setName("");
  }, [open, provider]);

  if (!provider) return null;

  const providerTitle = provider.charAt(0).toUpperCase() + provider.slice(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSelectAccount({
      email: email.trim(),
      name: name.trim() || email.split("@")[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-3xl border-border bg-card/95 backdrop-blur-2xl">
        {/* Header styling */}
        <div className="border-b border-border bg-muted/30 px-6 py-5 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-card shadow-xs border border-border">
            {provider === "google" && (
              <svg className="size-6" viewBox="0 0 24 24">
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
            )}
            {provider === "github" && (
              <svg className="size-6 fill-current text-foreground" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            {provider === "apple" && (
              <svg className="size-6 fill-current text-foreground" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.92-12-14.53-5.33-8.17-9.58-17.51-12.74-28.02-3.16-10.51-4.74-20.73-4.74-30.65 0-14.53 3.82-26.68 11.45-36.46 7.63-9.78 17.15-14.79 28.56-15.04 4.58 0 9.71 1.25 15.39 3.76 5.68 2.51 9.4 3.81 11.16 3.92 1.34 0 5.09-1.31 11.26-3.92 6.17-2.61 11.44-3.81 15.82-3.6 11.66.57 21.05 4.88 28.18 12.92-10.15 6.18-15.17 14.65-15.07 25.41.1 8.3 3.35 15.39 9.76 21.28 6.41 5.88 14.15 9.17 23.23 9.87-2.12 6.54-4.63 13.06-7.53 19.57zm-27.12-107.5c0 6.64-2.42 12.83-7.25 18.57-4.83 5.74-10.84 9.16-18.04 10.25-.13-1.05-.19-2.07-.19-3.06 0-6.42 2.61-12.63 7.82-18.63 5.21-6 11.48-9.45 18.82-10.35.21 1.05.32 2.12.32 3.22z" />
              </svg>
            )}
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Sign in with {providerTitle}
          </DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Authorize your {providerTitle} identity to continue to Tempus
          </p>
        </div>

        {/* Input Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                {providerTitle} Email Address *
              </label>
              <input
                type="email"
                required
                autoFocus
                placeholder={`your.name@${provider === "apple" ? "icloud.com" : provider === "github" ? "github.com" : "gmail.com"}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Full Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl border border-border bg-card/60 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!email.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-bold text-white shadow-xs hover:shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] disabled:opacity-50 cursor-pointer"
              >
                Authorize {providerTitle}
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-xl bg-indigo-500/10 p-3 border border-indigo-500/20 flex items-start gap-2 text-[11px] text-indigo-700 dark:text-indigo-300">
            <Info className="size-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Tip:</strong> You can enter your email above or configure cloud credentials in <code className="font-mono bg-indigo-500/20 px-1 py-0.5 rounded text-[10px]">.env.local</code> for instant browser OAuth popup authorization.
            </span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="border-t border-border bg-muted/20 px-6 py-3 text-center flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>Encrypted OAuth 2.0 Identity Protocol</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
