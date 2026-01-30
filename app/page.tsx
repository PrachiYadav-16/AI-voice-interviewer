"use client";

import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { HomePage } from "./components/HomePage";
import { Interview } from "./components/Interview";
import { JobRole } from "@/types/jobRoles";
import { LogOut, Home as HomeIcon } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY || "859a4847-534c-4116-9896-471f327b1285";

  // Show auth page if not logged in
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleStartInterview = (role: JobRole) => {
    setSelectedRole(role);
  };

  const handleBackToHome = () => {
    setSelectedRole(null);
  };

  // Show interview page if role is selected
  if (selectedRole) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-midnight">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-accent-purple/10 via-midnight to-accent-blue/10"
          style={{ backgroundSize: "200% 200%" }}
        />

        {/* Radial gradient overlays for depth */}
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-accent-purple/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-accent-blue/20 blur-3xl" />

        {/* Header with User Profile and Back Button */}
        <div className="absolute left-6 right-6 top-6 z-20 flex items-center justify-between">
          {/* Logo and Back Button */}
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-midnight-lighter/80 px-4 py-2 backdrop-blur-sm transition-colors hover:border-white/30"
          >
            <HomeIcon className="h-4 w-4 text-white/70" />
            <span className="text-sm text-white/70">Back to Home</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-midnight-lighter/80 px-4 py-2 backdrop-blur-sm">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="h-8 w-8 rounded-full"
              />
              <div className="text-left">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-white/50">{selectedRole.title}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-midnight-lighter/80 px-4 py-2 backdrop-blur-sm transition-colors hover:border-red-500/30 hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <Interview vapiApiKey={VAPI_API_KEY} jobRole={selectedRole} />
        </div>
      </main>
    );
  }

  // Show home page after login
  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-accent-purple/10 via-midnight to-accent-blue/10"
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Header with Logo and User Profile */}
      <div className="absolute left-6 right-6 top-6 z-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-black">
            IntervU
          </h1>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-midnight-lighter/80 px-4 py-2 backdrop-blur-sm">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="h-8 w-8 rounded-full"
            />
            <div className="text-left">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/50">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-midnight-lighter/80 px-4 py-2 backdrop-blur-sm transition-colors hover:border-red-500/30 hover:bg-red-500/10"
            title="Logout"
          >
            <LogOut className="h-4 w-4 text-white/70" />
            <span className="text-sm text-white/70">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <HomePage onStartInterview={handleStartInterview} userName={user?.name || "User"} />
      </div>
    </main>
  );
}
