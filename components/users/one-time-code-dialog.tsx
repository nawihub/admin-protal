"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usersApi } from "@/lib/api/admin";
import type { ManagedUser } from "@/lib/api/types";

/** Shows a pending admin's one-time sign-in code, to hand over through a trusted channel. */
export function OneTimeCodeDialog({ user, onClose }: { user: ManagedUser | null; onClose: () => void }) {
  const code = useQuery({
    queryKey: ["users", "otc", user?.id],
    queryFn: () => usersApi.oneTimeCode(user!.id),
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
  });
  const value = code.data?.oneTimeCode;
  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="size-5 text-secondary-500" /> Sign-in code</DialogTitle>
          <DialogDescription>
            Share this with {user?.firstName} privately. They use it with their email or username to sign in once, then set a password.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 p-6">
          {code.isLoading ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : code.isError ? (
            <p className="text-sm text-error">Couldn&apos;t load the code.</p>
          ) : (
            <span className="animate-scale-in select-all break-all text-center font-mono text-2xl font-semibold tracking-[0.2em]">{value}</span>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Done</Button>
          <Button disabled={!value} onClick={() => { navigator.clipboard?.writeText(value!); toast.success("Code copied"); }}>
            <Copy className="size-4" /> Copy code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
