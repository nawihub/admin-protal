"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, EyeOff, Smartphone } from "lucide-react";
import { RequireArea } from "@/components/auth/require-area";
import { PageHeader } from "@/components/data/page-header";
import { type Column } from "@/components/data/data-table";
import { Collection } from "@/components/data/collection";
import { SearchInput, Segments } from "@/components/data/filters";
import { StatusBadge, Tag } from "@/components/data/status-badge";
import { ViewToggle } from "@/components/data/view-toggle";
import { donationsApi } from "@/lib/api/admin";
import { useCursorList } from "@/lib/queries/use-cursor-list";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { initialsOf, timeAgo } from "@/lib/format";
import type { Donation } from "@/lib/api/types";
import { METHOD_LABEL, formatMoney } from "./format";

function MethodTag({ d }: { d: Donation }) {
  const Icon = d.method === "CARD" ? CreditCard : Smartphone;
  return (
    <Tag>
      <Icon className="mr-1 inline size-3" /> {METHOD_LABEL[d.method]}
    </Tag>
  );
}

function DonorCell({ d }: { d: Donation }) {
  return (
    <div className="flex min-w-[14rem] items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">{initialsOf(d.donor.fullName)}</span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate font-medium">
          {d.donor.fullName}
          {d.donor.anonymous && <EyeOff className="size-3.5 shrink-0 text-muted-foreground" aria-label="Anonymous publicly" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">{d.donor.email ?? d.donor.phone ?? "No contact"}</p>
      </div>
    </div>
  );
}

const COLUMNS: Column<Donation>[] = [
  { key: "donor", header: "Donor", cell: (d) => <DonorCell d={d} /> },
  { key: "amount", header: "Amount", cell: (d) => <span className="whitespace-nowrap font-mono text-sm font-semibold">{formatMoney(d.amount)}</span> },
  { key: "method", header: "Method", hideBelow: "md", cell: (d) => <MethodTag d={d} /> },
  { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
  { key: "created", header: "Started", hideBelow: "sm", cell: (d) => <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(d.createTime)}</span> },
];

function DonationCard({ d }: { d: Donation }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <DonorCell d={d} />
        <StatusBadge status={d.status} />
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="font-mono text-lg font-semibold">{formatMoney(d.amount)}</span>
        <MethodTag d={d} />
      </div>
      <p className="text-xs text-muted-foreground">{timeAgo(d.createTime)}</p>
    </div>
  );
}

/** Totals raised per currency, plus how many donations have gone through. */
function FundTotals() {
  const { data, isLoading } = useQuery({ queryKey: ["donations", "overview"], queryFn: donationsApi.overview, refetchInterval: 60_000 });
  const tiles = [
    ...(data?.raised ?? [{ value: 0, currency: "SLE" }, { value: 0, currency: "USD" }]).map((m) => ({
      key: m.currency,
      label: m.currency === "USD" ? "Raised by card" : "Raised by mobile money",
      value: formatMoney(m),
      Icon: m.currency === "USD" ? CreditCard : Smartphone,
    })),
    { key: "count", label: "Completed donations", value: (data?.completedDonations ?? 0).toLocaleString("en-GB"), Icon: CheckCircle2 },
  ];
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {tiles.map(({ key, label, value, Icon }, i) => (
        <div key={key} className="stagger-in rounded-2xl border border-border bg-card p-5 shadow-sm" style={{ "--stagger": i } as React.CSSProperties}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Icon className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold">{isLoading ? "…" : value}</p>
        </div>
      ))}
    </div>
  );
}

function DonationsList() {
  const router = useRouter();
  const { values, update } = useUrlState(["status", "method", "q"] as const);
  const [view, setView] = useViewMode("donations");
  const status = values.status || "ALL";
  const method = values.method || "ALL";
  const list = useCursorList(["donations", "list", status, method, values.q], (pageToken) =>
    donationsApi.list({
      pageSize: 20,
      pageToken,
      status: status === "ALL" ? undefined : status,
      method: method === "ALL" ? undefined : method,
      search: values.q || undefined,
    }),
  );

  return (
    <>
      <PageHeader
        title="Donations"
        description="Gifts to the Next Big Idea fund from the public site. Mobile money is paid in leones, card in US dollars; anonymous donors are named here but never publicly."
      />
      <FundTotals />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Segments
            value={status}
            onChange={(v) => update({ status: v })}
            segments={[
              { value: "ALL", label: "All" },
              { value: "COMPLETED", label: "Completed" },
              { value: "PENDING", label: "Pending" },
              { value: "EXPIRED", label: "Expired" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "FAILED", label: "Failed" },
            ]}
          />
          <Segments
            value={method}
            onChange={(v) => update({ method: v })}
            segments={[
              { value: "ALL", label: "Any method" },
              { value: "MOBILE_MONEY", label: "Mobile money" },
              { value: "CARD", label: "Card" },
            ]}
          />
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={values.q} onChange={(q) => update({ q })} placeholder="Search donor, email, phone or ID…" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
      <Collection
        view={view}
        columns={COLUMNS}
        renderCard={(d) => <DonationCard d={d} />}
        rows={list.items}
        getKey={(d) => d.id}
        onRowClick={(d) => router.push(`/donations/${d.id}`)}
        loading={list.isLoading}
        error={list.isError}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isFetchingNextPage}
        hasMore={list.hasNextPage}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={() => list.fetchNextPage()}
        empty={{ title: "No donations here", description: values.q ? "Nothing matches that search." : "Try another status or method." }}
      />
    </>
  );
}

export default function DonationsPage() {
  return (
    <RequireArea area="bigIdeas" label="Donations">
      <Suspense>
        <DonationsList />
      </Suspense>
    </RequireArea>
  );
}
