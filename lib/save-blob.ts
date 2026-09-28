/** Saves a downloaded file (e.g. from `api.blob`) under the given name. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/zip": ".zip",
};

/** A file name for a download whose stored name isn't known, from the type the gateway reported. */
export function fileNameFor(base: string, blob: Blob) {
  return base + (EXTENSIONS[blob.type] ?? "");
}
