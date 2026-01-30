"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function ResumeUpload({ onFileSelect, selectedFile }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    validateAndSelectFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const validateAndSelectFile = (file: File) => {
    // Validate file type (PDF, DOC, DOCX)
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File size must be less than 5MB");
      return;
    }

    onFileSelect(file);
  };

  const removeFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white/90">
        Upload Resume <span className="text-red-400">*</span>
      </label>

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all",
            isDragging
              ? "border-accent-purple bg-accent-purple/10"
              : "border-white/20 hover:border-white/40"
          )}
        >
          <Upload className="mb-3 h-10 w-10 text-white/40" />
          <p className="mb-2 text-sm font-medium text-white/70">
            Drag & drop your resume here
          </p>
          <p className="mb-4 text-xs text-white/50">
            or click to browse (PDF, DOC, DOCX - Max 5MB)
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-accent-purple/20 px-6 py-2 text-sm font-medium text-accent-purple transition-colors hover:bg-accent-purple/30"
          >
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-lg border border-accent-purple/30 bg-accent-purple/10 p-4">
          <FileText className="h-10 w-10 text-accent-purple" />
          <div className="flex-1">
            <p className="font-medium text-white">{selectedFile.name}</p>
            <p className="text-sm text-white/60">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <CheckCircle className="h-5 w-5 text-green-400" />
          <button
            type="button"
            onClick={removeFile}
            className="rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>
      )}
    </div>
  );
}
