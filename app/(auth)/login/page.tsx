"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. the refresh cookie restored a session) - go straight in.
  useEffect(() => {
    if (status === "authenticated") router.replace(user?.status === "PENDING" ? "/set-password" : "/");
  }, [status, user?.status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const session = await authApi.login(identifier.trim(), password);
      useAuthStore.getState().setSession(session.accessToken, session.user);
      router.replace(session.user.status === "PENDING" ? "/set-password" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setPending(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 lg:hidden">
        <Logo size="md" href={null} />
      </div>
      <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-600 dark:text-primary-400">
        <LockKeyhole className="size-6" />
      </div>
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to the NaWeHub admin console.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email or username</Label>
          <Input
            id="identifier"
            autoComplete="username"
            autoFocus
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@nawehub.com"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">New to the team? Use the one-time code you were given as your password.</p>
        </div>

        {error && (
          <div className="animate-fade-in-up flex items-start gap-2 rounded-xl border border-error/25 bg-error/5 p-3 text-sm text-error">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}

        <Button type="submit" size="lg" disabled={pending} className="group h-11 w-full">
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? "Signing in…" : "Sign in"}
          {!pending && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </form>
    </div>
  );
}
