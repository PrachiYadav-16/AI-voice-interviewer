"use client";

import { useState } from "react";
import { Sparkles, Briefcase } from "lucide-react";
import { JobRoleCard } from "./JobRoleCard";
import { JOB_ROLES, JOB_CATEGORIES, JobCategory, JobRole } from "@/types/jobRoles";
import { cn } from "@/lib/utils";

interface HomePageProps {
  onStartInterview: (role: JobRole) => void;
  userName: string;
}

export function HomePage({ onStartInterview, userName }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>("All");

  const filteredRoles =
    selectedCategory === "All"
      ? JOB_ROLES
      : JOB_ROLES.filter((role) => role.category === selectedCategory);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 pb-20 pt-32">
        {/* Glow effects */}
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-accent-purple/50 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-accent-blue/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-2">
          {/* Left Side - Content */}
          <div className="flex flex-col justify-center">
            {/* Greeting */}
            <div className="mb-6 flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <p className="text-lg text-white/60">
                Welcome back, <span className="font-semibold text-white">{userName}</span>!
              </p>
            </div>

            {/* Main heading */}
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white lg:text-6xl">
              Get Your Instant Interview
            </h1>

            <p className="mb-10 max-w-xl text-xl text-white/70">
              Practice with our AI interviewer. Choose your role below and start your
              personalized interview experience in seconds.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => {
                  const firstRole = JOB_ROLES[0];
                  onStartInterview(firstRole);
                }}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-accent-purple/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent-purple/60"
              >
                <Sparkles className="h-6 w-6" />
                Start Quick Interview
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
              
              <a
                href="#roles"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
              >
                <Briefcase className="h-4 w-4" />
                Browse Roles
              </a>
            </div>

            <p className="mt-6 text-sm text-white/40">
              Select a specific role below for targeted practice
            </p>
          </div>

          {/* Right Side - Robot Animation */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative">
              {/* Animated glow ring */}
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-accent-purple to-accent-blue opacity-20 blur-2xl" />
              
              {/* Robot Image/GIF */}
              <div className="relative">
                <img
                  src="https://i.pinimg.com/originals/0f/13/f0/0f13f0710c450c0c0546464bf828b59b.gif"
                  alt="AI Robot"
                  className="h-80 w-80 object-contain drop-shadow-2xl lg:h-96 lg:w-96"
                  onError={(e) => {
                    e.currentTarget.src = "https://media.tenor.com/4cQn3KLkKpQAAAAi/robot-happy.gif";
                  }}
                />
              </div>

              {/* Floating elements */}
              <div className="absolute -left-4 top-1/4 animate-bounce rounded-lg bg-accent-purple/20 p-3 backdrop-blur-sm">
                <span className="text-2xl">💡</span>
              </div>
              <div className="animation-delay-300 absolute -right-4 bottom-1/4 animate-bounce rounded-lg bg-accent-blue/20 p-3 backdrop-blur-sm">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Roles Section */}
      <div id="roles" className="mx-auto max-w-7xl px-6 py-16">
        {/* Section Header */}
        <div className="mb-8 flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-accent-purple" />
          <h2 className="text-3xl font-bold text-white">Choose Your Interview Role</h2>
        </div>

        <p className="mb-8 text-lg text-white/60">
          Select the position you're preparing for and get role-specific questions
        </p>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {JOB_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-all",
                selectedCategory === category
                  ? "bg-gradient-to-r from-accent-purple to-accent-blue text-white shadow-lg"
                  : "border border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Job Roles Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role) => (
            <JobRoleCard key={role.id} role={role} onSelect={onStartInterview} />
          ))}
        </div>

        {/* Empty state */}
        {filteredRoles.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-white/40">No roles found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
