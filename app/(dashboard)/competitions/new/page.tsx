"use client";

import { useRouter } from "next/navigation";
import { RequireArea } from "@/components/auth/require-area";
import { BackLink } from "@/components/data/detail";
import { PageHeader } from "@/components/data/page-header";
import { CompetitionForm } from "@/components/competitions/competition-form";
import { competitionsApi } from "@/lib/api/admin";
import { useAction } from "@/lib/hooks/use-action";
import type { CompetitionInput } from "@/lib/api/types";

function NewCompetition() {
  const router = useRouter();
  const create = useAction((input: CompetitionInput) => competitionsApi.create(input), {
    success: "Competition saved as a draft",
    invalidate: [["competitions"]],
  });
  return (
    <>
      <BackLink href="/competitions" label="Competitions" />
      <PageHeader title="New competition" description="It's saved as a draft - nobody sees it until you publish it." />
      <CompetitionForm
        pending={create.isPending}
        submitLabel="Save draft"
        onSubmit={(input) => create.mutate(input, { onSuccess: (c) => router.replace(`/competitions/${c.id}`) })}
      />
    </>
  );
}

export default function NewCompetitionPage() {
  return (
    <RequireArea area="bigIdeas" label="Competitions" manage>
      <div className="mx-auto max-w-4xl"><NewCompetition /></div>
    </RequireArea>
  );
}
