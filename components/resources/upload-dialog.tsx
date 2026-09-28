"use client";

import { useRef, useState } from "react";
import { FileUp, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resourcesApi } from "@/lib/api/admin";
import { useAction } from "@/lib/hooks/use-action";
import { cn, formatEnumLabel, formatFileSize } from "@/lib/utils";

const FORMATS = ["GUIDE", "TEMPLATE", "CHECKLIST", "CASE_STUDY", "COURSE", "FRAMEWORK"] as const;
const ACCESS = [
  { value: "PUBLIC", label: "Public", hint: "Every entrepreneur" },
  { value: "PREMIUM", label: "Premium", hint: "Paid access" },
  { value: "PRIVATE", label: "Private", hint: "Admins only" },
] as const;

export function UploadDialog({ folderId, open, onOpenChange }: { folderId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<string>("GUIDE");
  const [access, setAccess] = useState<string>("PUBLIC");
  const [tags, setTags] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const isVideo = file?.type.startsWith("video/") ?? false;

  function reset() {
    setFile(null); setThumb(null); setTitle(""); setDescription(""); setFormat("GUIDE"); setAccess("PUBLIC"); setTags("");
  }
  function pick(f: File | undefined | null) {
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  }

  const upload = useAction(
    () => {
      const form = new FormData();
      const resource = {
        folderId, title: title.trim(), description: description.trim(), accessLevel: access,
        format: isVideo ? "NOT_APPLICABLE" : format,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      form.append("resource", new Blob([JSON.stringify(resource)], { type: "application/json" }));
      form.append("file", file!);
      if (thumb) form.append("thumbnail", thumb);
      return resourcesApi.upload(form);
    },
    { success: "Uploaded - it's pending review", invalidate: [["resources"]] },
  );

  const valid = !!file && title.trim() && description.trim();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (upload.isPending) return; onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload resource</DialogTitle>
          <DialogDescription>Documents and videos. New uploads start as pending and need approval before entrepreneurs see them.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) upload.mutate(undefined, { onSuccess: () => { onOpenChange(false); reset(); } }); }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-normal",
              dragging ? "scale-[1.01] border-primary-400 bg-primary-500/5" : "border-border hover:border-primary-300 hover:bg-muted/40",
            )}
          >
            {file ? (
              <div className="flex w-full items-center gap-3 text-left">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600"><FileUp className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}{isVideo && " · video"}</span>
                </span>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove file" onClick={(e) => { e.stopPropagation(); setFile(null); }}><X className="size-4" /></Button>
              </div>
            ) : (
              <>
                <UploadCloud className={cn("size-8 text-muted-foreground transition-transform", dragging && "-translate-y-1 text-primary-500")} />
                <p className="text-sm font-medium">Drop a file or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, Office documents, or video</p>
              </>
            )}
            <input ref={fileInput} type="file" hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="r-title">Title</Label>
              <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="r-desc">Description</Label>
              <Textarea id="r-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will an entrepreneur get out of this?" />
            </div>
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select value={isVideo ? "NOT_APPLICABLE" : format} onValueChange={setFormat} disabled={isVideo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isVideo && <SelectItem value="NOT_APPLICABLE">Video</SelectItem>}
                  {FORMATS.map((f) => <SelectItem key={f} value={f}>{formatEnumLabel(f)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-tags">Tags</Label>
              <Input id="r-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="stage:launch, domain:tax" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Who can access it</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACCESS.map((a) => (
                <button
                  key={a.value} type="button" onClick={() => setAccess(a.value)}
                  className={cn("rounded-xl border p-3 text-left transition-all", access === a.value ? "border-primary-400 bg-primary-500/5 ring-4 ring-primary-500/10" : "border-border hover:bg-muted/50")}
                >
                  <span className="block text-sm font-medium">{a.label}</span>
                  <span className="text-xs text-muted-foreground">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40">
            <ImagePlus className="size-5 text-muted-foreground" />
            <span className="min-w-0 flex-1 text-sm">{thumb ? <span className="truncate">{thumb.name}</span> : <>Thumbnail <span className="text-muted-foreground">(optional)</span></>}</span>
            <input type="file" accept="image/*" hidden onChange={(e) => setThumb(e.target.files?.[0] ?? null)} />
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={upload.isPending}>Cancel</Button>
            <Button type="submit" disabled={!valid || upload.isPending}>
              {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
