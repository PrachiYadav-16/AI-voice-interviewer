"use client";

import { JobRole } from "@/types/jobRoles";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobRoleCardProps {
  role: JobRole;
  onSelect: (role: JobRole) => void;
}

export function JobRoleCard({ role, onSelect }: JobRoleCardProps) {
  return (
    <button
      onClick={() => onSelect(role)}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-midnight-lighter p-6 text-left transition-all hover:scale-105 hover:border-white/30 hover:shadow-xl"
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10",
          role.color
        )}
      />

      {/* Content */}
      <div className="relative space-y-4">
        {/* Icon and Category */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{role.icon}</div>
            <div>
              <h3 className="font-semibold text-white">{role.title}</h3>
              <p className="text-xs text-white/50">{role.category}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white/70" />
        </div>

        {/* Description */}
        <p className="text-sm text-white/60">{role.description}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {role.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              {skill}
            </span>
          ))}
          {role.skills.length > 3 && (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
              +{role.skills.length - 3}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
