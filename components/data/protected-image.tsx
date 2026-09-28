"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/**
 * An image behind the gateway's auth: fetched with the admin's token as a blob, then shown from
 * an object URL. Renders `fallback` while loading or when the image is missing.
 */
export function ProtectedImage({ queryKey, fetcher, alt, className, fallback }: {
  queryKey: readonly unknown[]; fetcher: () => Promise<Blob>; alt: string; className?: string; fallback?: React.ReactNode;
}) {
  const { data } = useQuery({ queryKey: [...queryKey, "blob"], queryFn: fetcher, staleTime: 10 * 60_000, retry: false });
  const [loaded, setLoaded] = useState(false);
  const url = useMemo(() => (data && data.type.startsWith("image/") ? URL.createObjectURL(data) : null), [data]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  return (
    <>
      {!loaded && fallback}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- object URL, not optimisable
        <img src={url} alt={alt} onLoad={() => setLoaded(true)} className={cn("transition-opacity duration-slow", loaded ? "opacity-100" : "opacity-0", className)} />
      )}
    </>
  );
}
