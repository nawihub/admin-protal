"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** A yes/no confirmation for consequential actions. */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, pending, onConfirm,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: React.ReactNode;
  confirmLabel?: string; destructive?: boolean; pending?: boolean; onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "default"} disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Asks for a reason (declines, rejections, suspensions) - the reason is shown to the person affected. */
export function ReasonDialog({
  open, onOpenChange, title, description, confirmLabel = "Submit", pending, onSubmit, placeholder,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel?: string;
  pending?: boolean; onSubmit: (reason: string) => void; placeholder?: string;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setReason(""); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder ?? "Explain the decision so they know what to improve…"}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={pending || reason.trim().length < 5} onClick={() => onSubmit(reason.trim())}>
            {pending && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
