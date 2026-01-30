"use client";

import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AvatarSelector } from "./AvatarSelector";
import { ResumeUpload } from "./ResumeUpload";
import { DEFAULT_AVATARS } from "@/types/user";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!resumeFile) {
      alert("Please upload your resume");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const success = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      avatar: selectedAvatar,
      resumeFile: resumeFile,
    });

    setIsLoading(false);

    if (!success) {
      // Error message already shown in signup function
      return;
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-white">Create Account</h2>
        <p className="text-white/60">Join IntervU and start your journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">
            Full Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="John Doe"
              className="w-full rounded-lg border border-white/20 bg-midnight-lighter px-12 py-3 text-white placeholder-white/40 transition-colors focus:border-accent-purple focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">
            Email Address <span className="text-red-400">*</span>
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
          <label className="text-sm font-medium text-white/90">
            Password <span className="text-red-400">*</span>
          </label>
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">
            Confirm Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/20 bg-midnight-lighter px-12 py-3 text-white placeholder-white/40 transition-colors focus:border-accent-purple focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Avatar Selection */}
        <AvatarSelector
          selectedAvatar={selectedAvatar}
          onSelect={setSelectedAvatar}
        />

        {/* Resume Upload */}
        <ResumeUpload
          onFileSelect={setResumeFile}
          selectedFile={resumeFile}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent-purple/50 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center">
        <p className="text-sm text-white/60">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-accent-purple hover:text-accent-blue"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
