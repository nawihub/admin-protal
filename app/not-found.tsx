import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="app-aura flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="float-slow flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-secondary-400 text-white shadow-lg">
        <Compass className="size-8" />
      </span>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="font-display text-3xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The link may be old, or the item may have been deleted.</p>
      <Link href="/" className="mt-2 inline-flex h-10 items-center rounded-xl bg-primary-500 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600">
        Back to the dashboard
      </Link>
    </main>
  );
}
