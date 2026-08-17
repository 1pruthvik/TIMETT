"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, LogOut, CheckCircle2 } from "lucide-react";

interface UserProfile {
  id?: number;
  name: string;
  email: string;
  role?: string;
  is_active?: boolean;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <AppShell>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account & Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal details and account preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Your personal and institutional information</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="mr-1 size-3.5" />
                Active Account
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {loading ? (
              <div className="py-6 text-sm text-muted-foreground">Loading account details...</div>
            ) : user ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Full Name</p>
                      <p className="text-sm font-medium mt-0.5">{user.name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Email Address</p>
                      <p className="text-sm font-medium mt-0.5">{user.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Shield className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Role</p>
                      <p className="text-sm font-medium mt-0.5 capitalize">{user.role || "Administrator"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                      <p className="text-sm font-medium mt-0.5">
                        {user.is_active !== false ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h3 className="text-sm font-medium text-destructive">Sign Out</h3>
                    <p className="text-xs text-muted-foreground">
                      Sign out of your active session on this device.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleLogout} className="gap-2">
                    <LogOut className="size-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No user session found.</p>
                <Button className="mt-4" onClick={() => (window.location.href = "/login")}>
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
