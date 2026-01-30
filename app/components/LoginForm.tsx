"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const success = await login(formData.email, formData.password);
    setIsLoading(false);

    if (!success) {
      // Error message already shown in login function
      return;
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-white">Welcome Back</h2>
        <p className="text-white/60">Log in to continue your interview</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              className="w-full rounded-lg border border-white/20 bg-midnight-lighter px-12 py-3 text-white placeholder-white/40 transition-colors focus:border-accent-purple focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/20 bg-midnight-lighter px-12 py-3 text-white placeholder-white/40 transition-colors focus:border-accent-purple focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent-purple/50 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center">
        <p className="text-sm text-white/60">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            className="font-medium text-accent-purple hover:text-accent-blue"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
