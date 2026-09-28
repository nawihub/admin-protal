"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordRules, passwordValid } from "@/components/auth/password-rules";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";


/** First sign-in with a one-time code: the admin chooses their own password to activate. */
export default function SetPasswordPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = passwordValid(password) && password === confirm;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user?.status === "ACTIVE") router.replace("/");
  }, [status, user?.status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    setError(null);
    try {
      await authApi.createPassword(password);
      // Re-mint the session so the token and profile reflect the now-ACTIVE account.
      if (!(await authApi.refresh())) throw new Error("Password set - please sign in again");
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set your password");
      setPending(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-secondary-500/15 text-secondary-600 dark:text-secondary-400">
        <KeyRound className="size-6" />
      </div>
      <h1 className="font-display text-3xl font-semibold">Set your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome{user ? `, ${user.firstName}` : ""}! Choose a password to activate your admin account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
        </div>
        <PasswordRules password={password} />
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
          {confirm && confirm !== password && <p className="text-xs text-error">Passwords don&apos;t match</p>}
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-error/25 bg-error/5 p-3 text-sm text-error">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
        <Button type="submit" size="lg" disabled={!valid || pending} className="h-11 w-full">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Activate account
        </Button>
      </form>
    </div>
  );
}
