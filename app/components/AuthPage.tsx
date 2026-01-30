"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight p-6">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-accent-purple/10 via-midnight to-accent-blue/10"
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Radial gradient overlays */}
      <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-accent-purple/20 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent-blue/20 blur-3xl" />

      {/* Logo */}
      <div className="absolute left-8 top-8">
        <h1 className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-3xl font-bold text-transparent">
          IntervU
        </h1>
      </div>

      {/* Auth Form Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-midnight-lighter/50 p-8 backdrop-blur-xl">
        {isLogin ? (
          <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
