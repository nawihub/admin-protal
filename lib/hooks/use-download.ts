"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveBlob } from "@/lib/save-blob";

const EXT: Record<string, string> = {
  "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
  "video/mp4": ".mp4", "video/webm": ".webm", "application/zip": ".zip",
};

/** Fetches a protected file with the admin's token and saves it (or opens it for preview). */
export function useDownload() {
  const [busy, setBusy] = useState<string | null>(null);
  async function download(key: string, fetcher: () => Promise<Blob>, baseName: string, mode: "save" | "open" = "save") {
    setBusy(key);
    try {
      const blob = await fetcher();
      if (mode === "open") {
        window.open(URL.createObjectURL(blob), "_blank", "noopener");
      } else {
        saveBlob(blob, baseName.includes(".") ? baseName : baseName + (EXT[blob.type] ?? ""));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }
  return { busy, download };
}
