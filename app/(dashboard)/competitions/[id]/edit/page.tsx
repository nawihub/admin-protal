"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink, DetailSkeleton } from "@/components/data/detail";
import { PageHeader } from "@/components/data/page-header";
import { CompetitionForm } from "@/components/competitions/competition-form";
import { competitionsApi } from "@/lib/api/admin";
import { useAction } from "@/lib/hooks/use-action";
import type { CompetitionInput } from "@/lib/api/types";

function EditCompetition({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({ queryKey: ["competitions", "detail", id], queryFn: () => competitionsApi.get(id) });
  const save = useAction((input: CompetitionInput) => competitionsApi.update(id, input), {
    success: "Changes saved",
    invalidate: [["competitions"]],
  });
  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <p className="py-20 text-center text-muted-foreground">This competition couldn&apos;t be found.</p>;
  if (data.state === "COMPLETED" || data.state === "CANCELLED")
    return <p className="py-20 text-center text-muted-foreground">A {data.state.toLowerCase()} competition can&apos;t be edited.</p>;
  return (
    <>
      <BackLink href={`/competitions/${id}`} label={data.title} />
      <PageHeader title="Edit competition" description="Some settings lock as the competition moves on, so entrants are judged on what they applied to." />
      <CompetitionForm
        competition={data}
        pending={save.isPending}
        submitLabel="Save changes"
        onSubmit={(input) => save.mutate(input, { onSuccess: () => router.replace(`/competitions/${id}`) })}
      />
    </>
  );
}

export default function EditCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireArea area="bigIdeas" label="Competitions" manage>
      <div className="mx-auto max-w-4xl"><EditCompetition id={id} /></div>
    </RequireArea>
  );
}
