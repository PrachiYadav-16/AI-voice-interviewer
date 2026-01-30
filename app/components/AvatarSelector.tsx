"use client";

import { useState, useRef } from "react";
import { Check, Upload, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_AVATARS } from "@/types/user";

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

export function AvatarSelector({
  selectedAvatar,
  onSelect,
}: AvatarSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }

    // Read and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomAvatar(result);
      onSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const allAvatars = customAvatar ? [customAvatar, ...DEFAULT_AVATARS] : DEFAULT_AVATARS;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white/90">
        Choose Your Avatar
      </label>
      
      <div className="grid grid-cols-4 gap-3">
        {/* Custom Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative aspect-square rounded-full border-2 border-dashed transition-all hover:scale-105 flex items-center justify-center",
            customAvatar && selectedAvatar === customAvatar
              ? "border-accent-purple bg-accent-purple/10 shadow-lg shadow-accent-purple/50"
              : "border-white/20 hover:border-white/40 bg-white/5"
          )}
        >
          {customAvatar && selectedAvatar === customAvatar ? (
            <>
              <img
                src={customAvatar}
                alt="Custom avatar"
                className="h-full w-full rounded-full object-cover"
              />
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple">
                <Check className="h-4 w-4 text-white" />
              </div>
            </>
          ) : customAvatar ? (
            <img
              src={customAvatar}
              alt="Custom avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera className="h-6 w-6 text-white/40" />
              <span className="text-xs text-white/40">Upload</span>
            </div>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Default Avatars */}
        {DEFAULT_AVATARS.map((avatar, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(avatar)}
            className={cn(
              "relative aspect-square rounded-full border-2 transition-all hover:scale-105",
              selectedAvatar === avatar
                ? "border-accent-purple shadow-lg shadow-accent-purple/50"
                : "border-white/20 hover:border-white/40"
            )}
          >
            <img
              src={avatar}
              alt={`Avatar ${index + 1}`}
              className="h-full w-full rounded-full"
            />
            {selectedAvatar === avatar && (
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      
      <p className="text-xs text-white/40">
        Choose from default avatars or upload your own (max 2MB)
      </p>
    </div>
  );
}
