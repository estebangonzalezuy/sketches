"use client";

import { useRef } from "react";
import { FileUpIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { validate } from "@/lib/kv/model";
import type { PosterSource } from "./use-studio";

/** Which poster is animated: the built-in Motion, Now KV, or a JSON saved from the KV Editor (⌘S there). */
export function SourceMenu({ source, onChange }: { source: PosterSource; onChange: (s: PosterSource) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const open = async (file: File) => {
    try {
      const comp = validate(JSON.parse(await file.text()));
      onChange({ kind: "import", name: file.name.replace(/\.json$/i, ""), comp });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That isn't a KV Editor JSON.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="max-w-40 truncate">
        {source.kind === "preset" ? "Motion, Now" : source.name}
      </Badge>
      {source.kind === "import" && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ kind: "preset" })}>
          Built-in
        </Button>
      )}
      <Button variant="outline" size="icon" aria-label="Open KV Editor JSON" className="sm:w-auto sm:px-2.5" onClick={() => fileRef.current?.click()}>
        <FileUpIcon />
        <span className="hidden sm:inline">Open JSON</span>
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void open(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
