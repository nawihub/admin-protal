"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Banknote, Check, CheckCircle2, Copy, Download, Eye, FileSearch, Loader2, Receipt, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailHeader, DetailSkeleton, Field, FieldGrid, Section } from "@/components/data/detail";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ReasonDialog } from "@/components/data/action-dialogs";
import { businessesApi } from "@/lib/api/admin";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useAction } from "@/lib/hooks/use-action";
import { useDownload } from "@/lib/hooks/use-download";
import { cn, formatEnumLabel } from "@/lib/utils";
import { formatDate, initialsOf } from "@/lib/format";
import type { BusinessStatus } from "@/lib/api/types";

// PENDING -> IN_REVIEW -> PAYMENT_PENDING -> PROCESSING -> APPROVED (rejection only before payment)
const STEPS: { status: BusinessStatus; label: string }[] = [
  { status: "PENDING", label: "Submitted" },
  { status: "IN_REVIEW", label: "In review" },
  { status: "PAYMENT_PENDING", label: "Fee requested" },
  { status: "PROCESSING", label: "Fee paid" },
  { status: "APPROVED", label: "Registered" },
];

function Stepper({ status }: { status: BusinessStatus }) {
  const rejected = status === "REJECTED";
  const current = rejected ? -1 : STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < current || status === "APPROVED";
        const active = i === current && status !== "APPROVED";
        return (
          <li key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "stagger-in flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  done && "border-primary-500 bg-primary-500 text-white",
                  active && "border-secondary-400 bg-secondary-400/15 text-secondary-700 ring-4 ring-secondary-400/15 dark:text-secondary-300",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
                style={{ "--stagger": i } as React.CSSProperties}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("whitespace-nowrap text-[11px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="relative mx-1 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                {done && <span className="animate-grow-x absolute inset-0 origin-left bg-primary-500" />}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ApproveDialog({ open, onOpenChange, pending, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; pending: boolean; onSubmit: (regNo: string, date: string) => void;
}) {
  const [regNo, setRegNo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete registration</DialogTitle>
          <DialogDescription>Enter the details from the registration certificate. The owner is notified once saved.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(regNo.trim(), date); }}>
          <div className="space-y-1.5">
            <Label htmlFor="regNo">Registration number</Label>
            <Input id="regNo" autoFocus value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g. BR-2026-00123" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="regDate">Registration date</Label>
            <Input id="regDate" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || !regNo.trim() || !date}>
              {pending && <Loader2 className="size-4 animate-spin" />} Mark as registered
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BusinessDetail({ id }: { id: string }) {
  const { canManage } = usePermissions();
  const manage = canManage("businesses");
  const { data: b, isLoading, isError } = useQuery({ queryKey: ["businesses", "detail", id], queryFn: () => businessesApi.get(id) });
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const { busy, download } = useDownload();

  const invalidate = [["businesses"]] as const;
  const markInReview = useAction(() => businessesApi.markInReview(id), { success: "Moved to review", invalidate });
  const requestPayment = useAction(() => businessesApi.requestPayment(id), { success: "Registration fee requested", invalidate });
  const confirmPayment = useAction(() => businessesApi.confirmPayment(id), { success: "Payment confirmed", invalidate });
  const approve = useAction((a: { regNo: string; date: string }) => businessesApi.approve(id, a.regNo, a.date), { success: "Business registered", invalidate });
  const reject = useAction((reason: string) => businessesApi.reject(id, reason), { success: "Registration rejected", invalidate });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !b) return <p className="py-20 text-center text-muted-foreground">This business couldn&apos;t be found.</p>;

  const s = b.status;
  const next: Record<string, React.ReactNode> = {
    PENDING: (
      <Button onClick={() => markInReview.mutate()} disabled={markInReview.isPending}>
        {markInReview.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />} Start review
      </Button>
    ),
    IN_REVIEW: (
      <Button onClick={() => requestPayment.mutate()} disabled={requestPayment.isPending}>
        {requestPayment.isPending ? <Loader2 className="size-4 animate-spin" /> : <Receipt className="size-4" />} Request fee
      </Button>
    ),
    PAYMENT_PENDING: (
      <Button onClick={() => confirmPayment.mutate()} disabled={confirmPayment.isPending}>
        {confirmPayment.isPending ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />} Confirm payment
      </Button>
    ),
    PROCESSING: (
      <Button onClick={() => setDialog("approve")}>
        <CheckCircle2 className="size-4" /> Complete registration
      </Button>
    ),
  };
  const actions = manage && (next[s] || s === "PENDING" || s === "IN_REVIEW") ? (
    <>
      {next[s]}
      {(s === "PENDING" || s === "IN_REVIEW") && (
        <Button variant="outline" className="border-error/40 text-error hover:bg-error/10" onClick={() => setDialog("reject")}>
          <XCircle className="size-4" /> Reject
        </Button>
      )}
    </>
  ) : null;

  const category = b.businessCategory === "OTHER" && b.otherCategory ? b.otherCategory : formatEnumLabel(b.businessCategory);

  return (
    <>
      <BackLink href="/businesses" label="Businesses" />
      <DetailHeader
        icon={<span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 font-display text-lg font-semibold text-white shadow-lg">{initialsOf(b.businessName)}</span>}
        status={<><StatusBadge status={s} /><Tag>{category}</Tag><Tag>{formatEnumLabel(b.businessEntityType)}</Tag></>}
        title={b.businessName}
        subtitle={`Owned by ${b.ownerName}`}
        meta={
          <>
            <span>Submitted {formatDate(b.createTime, true)}</span>
            <button type="button" className="inline-flex items-center gap-1 font-mono hover:text-foreground" onClick={() => { navigator.clipboard?.writeText(b.trackingId); toast("Tracking ID copied"); }}>
              #{b.trackingId} <Copy className="size-3" />
            </button>
          </>
        }
        actions={actions}
      />

      <div className="animate-fade-in-up mb-6 overflow-x-auto rounded-2xl border border-border bg-card p-5 shadow-sm">
        {s === "REJECTED" ? (
          <div className="text-sm">
            <p className="font-medium text-error">Registration rejected</p>
            {b.rejectionReason && <p className="mt-1">{b.rejectionReason}</p>}
          </div>
        ) : (
          <div className="min-w-[32rem]"><Stepper status={s} /></div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Business" index={0}>
            <FieldGrid>
              <Field label="Activities" full>{b.businessActivities}</Field>
              <Field label="Address">{b.businessAddress}</Field>
              <Field label="Entity type">{formatEnumLabel(b.businessEntityType)}</Field>
              <Field label="Category">{category}</Field>
              <Field label="Linked account">{b.ownerId ? "Yes - owner has a NaWeHub account" : "No account"}</Field>
            </FieldGrid>
          </Section>
          {s === "APPROVED" && (
            <Section title="Registration" index={1}>
              <FieldGrid>
                <Field label="Registration number"><span className="font-mono">{b.registrationNumber}</span></Field>
                <Field label="Registered on">{formatDate(b.registerDate)}</Field>
              </FieldGrid>
            </Section>
          )}
        </div>
        <div className="space-y-6">
          <Section title="Owner ID document" index={2}>
            {b.documentUrl ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={busy !== null} onClick={() => download("open", () => businessesApi.document(id), "id-document", "open")}>
                  {busy === "open" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />} View
                </Button>
                <Button variant="outline" className="flex-1" disabled={busy !== null} onClick={() => download("save", () => businessesApi.document(id), `${b.businessName} - ID document`)}>
                  {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Download
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No document on file.</p>
            )}
          </Section>
        </div>
      </div>

      <ApproveDialog
        open={dialog === "approve"}
        onOpenChange={(open) => setDialog(open ? "approve" : null)}
        pending={approve.isPending}
        onSubmit={(regNo, date) => approve.mutate({ regNo, date }, { onSuccess: () => setDialog(null) })}
      />
      <ReasonDialog
        open={dialog === "reject"}
        onOpenChange={(open) => setDialog(open ? "reject" : null)}
        title="Reject this registration"
        description="The owner receives this reason and can use their tracking ID to see it."
        confirmLabel="Reject"
        pending={reject.isPending}
        onSubmit={(reason) => reject.mutate(reason, { onSuccess: () => setDialog(null) })}
      />
    </>
  );
}

export default function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireArea area="businesses" label="Businesses">
      <div className="mx-auto max-w-6xl"><BusinessDetail id={id} /></div>
    </RequireArea>
  );
}
