"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, EyeOff, HandHeart, Smartphone } from "lucide-react";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailHeader, DetailSkeleton, Field, FieldGrid, Section } from "@/components/data/detail";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { donationsApi } from "@/lib/api/admin";
import { formatDate, timeAgo } from "@/lib/format";
import { METHOD_LABEL, formatMoney } from "../format";

const STATUS_NOTE: Record<string, string> = {
  PENDING: "Waiting for the donor to pay.",
  COMPLETED: "Paid - the amount is in the fund.",
  EXPIRED: "The donor didn't pay in time. No money was taken.",
  CANCELLED: "Cancelled before payment. No money was taken.",
  FAILED: "The payment didn't go through. No money was taken.",
};

function DonationDetail({ id }: { id: string }) {
  const { data: d, isLoading, isError } = useQuery({
    queryKey: ["donations", "detail", id],
    queryFn: () => donationsApi.get(id),
    // A pending donation settles on its own; keep it current while it's open.
    refetchInterval: (q) => (q.state.data?.status === "PENDING" ? 10_000 : false),
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !d) return <p className="text-sm text-muted-foreground">We couldn&rsquo;t load this donation.</p>;
  const MethodIcon = d.method === "CARD" ? CreditCard : Smartphone;

  return (
    <>
      <BackLink href="/donations" label="Donations" />
      <DetailHeader
        icon={
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-300 to-primary-500 text-white shadow-sm">
            <HandHeart className="size-5" />
          </span>
        }
        title={formatMoney(d.amount)}
        subtitle={`from ${d.donor.fullName}`}
        status={
          <>
            <StatusBadge status={d.status} />
            <Tag><MethodIcon className="mr-1 inline size-3" /> {METHOD_LABEL[d.method]}</Tag>
            {d.donor.anonymous && <Tag><EyeOff className="mr-1 inline size-3" /> Anonymous publicly</Tag>}
          </>
        }
        meta={
          <>
            <span>Started {formatDate(d.createTime, true)}</span>
            <span>Updated {timeAgo(d.updateTime)}</span>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Donor" index={0}>
          <FieldGrid>
            <Field label="Name">{d.donor.fullName}</Field>
            <Field label="Shown publicly as">{d.donor.anonymous ? "Anonymous" : "First name and initial"}</Field>
            <Field label="Email">{d.donor.email ? <a className="text-primary hover:underline" href={`mailto:${d.donor.email}`}>{d.donor.email}</a> : "-"}</Field>
            <Field label="Phone">{d.donor.phone ? <a className="text-primary hover:underline" href={`tel:${d.donor.phone}`}>{d.donor.phone}</a> : "-"}</Field>
          </FieldGrid>
        </Section>
        <Section title="Payment" index={1}>
          <FieldGrid>
            <Field label="Status" full>{STATUS_NOTE[d.status] ?? d.status}</Field>
            {d.failureReason && <Field label="Reason" full>{d.failureReason}</Field>}
            <Field label="Amount">{formatMoney(d.amount)}</Field>
            <Field label="Method">{METHOD_LABEL[d.method]}{d.method === "CARD" ? " (USD account)" : " (SLE account)"}</Field>
            {d.ussdCode && <Field label="USSD code"><span className="font-mono">{d.ussdCode}</span></Field>}
            {d.status === "PENDING" && d.expiresAt && <Field label="Expires">{formatDate(d.expiresAt, true)}</Field>}
            <Field label="Donation ID"><span className="break-all font-mono text-xs">{d.id}</span></Field>
            <Field label="Payment ID"><span className="break-all font-mono text-xs">{d.paymentId ?? "-"}</span></Field>
          </FieldGrid>
        </Section>
      </div>
    </>
  );
}

export default function DonationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireArea area="bigIdeas" label="Donations">
      <DonationDetail id={id} />
    </RequireArea>
  );
}
