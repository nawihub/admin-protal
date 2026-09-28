import { ShieldOff } from "lucide-react";

/** Shown in place of a page the admin has no permission to view. */
export function Forbidden({ area }: { area?: string }) {
  return (
    <div className="animate-fade-in-up mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <div className="float-slow flex size-16 items-center justify-center rounded-2xl bg-error/10 text-error">
        <ShieldOff className="size-8" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold">You don&apos;t have access{area ? ` to ${area}` : ""}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your admin account doesn&apos;t include this permission. Ask an administrator with user-management access to grant it.
        </p>
      </div>
    </div>
  );
}
