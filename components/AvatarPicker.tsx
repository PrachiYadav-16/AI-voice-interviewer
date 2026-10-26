"use client";

import { useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEFAULT_AVATARS = ["Felix", "Aneka", "Luna", "Max", "Sophie", "Charlie", "Oliver"].map(
  (seed) => `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=e8eaf8`,
);

/** Downscale to a small square JPEG so avatars don't eat browser storage. */
async function toSmallDataUrl(file: File, size = 160): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - s) / 2, (bitmap.height - s) / 2, s, s, 0, 0, size, size);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [custom, setCustom] = useState<string | null>(value && !DEFAULT_AVATARS.includes(value) ? value : null);
  const [error, setError] = useState<string>();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(undefined);
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 8 * 1024 * 1024) return setError("Choose an image under 8 MB.");
    try {
      const url = await toSmallDataUrl(file);
      setCustom(url);
      onChange(url);
    } catch {
      setError("That image couldn't be read. Try a different file.");
    }
  };

  const options = custom ? [custom, ...DEFAULT_AVATARS] : DEFAULT_AVATARS;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold">Profile picture (optional)</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((a, i) => (
          <button
            type="button"
            key={a}
            onClick={() => onChange(a)}
            aria-pressed={value === a}
            aria-label={a === custom ? "Your uploaded picture" : `Illustrated avatar ${i + (custom ? 0 : 1)}`}
            className={cn(
              "relative h-12 w-12 rounded-full border-2 bg-surface",
              value === a ? "border-indigo" : "border-line hover:border-line-strong",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a} alt="" className="h-full w-full rounded-full object-cover" />
            {value === a && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-indigo text-white">
                <Check className="h-3 w-3" aria-hidden />
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-line-strong text-muted hover:border-ink hover:text-ink"
          aria-label="Upload your own picture"
        >
          <Camera className="h-5 w-5" aria-hidden />
        </button>
        <input ref={input} type="file" accept="image/*" onChange={onFile} className="hidden" />
      </div>
      {error && <p className="text-sm text-brick">{error}</p>}
    </fieldset>
  );
}
