"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, AuthContextType, SignupData } from "@/types/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("intervu_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("intervu_user");
      }
    }
    setIsLoading(false);
  }, []);

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(
        localStorage.getItem("intervu_users") || "[]"
      );
      
      const userExists = existingUsers.some(
        (u: any) => u.email === data.email
      );

      if (userExists) {
        alert("User with this email already exists!");
        return false;
      }

      // Create new user profile
      const newUser: UserProfile = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        resumeFileName: data.resumeFile?.name,
        createdAt: new Date(),
      };

      // Store password separately (in production, use proper backend auth)
      const userWithPassword = {
        ...newUser,
        password: data.password, // In production, hash this!
      };

      // Save to localStorage
      existingUsers.push(userWithPassword);
      localStorage.setItem("intervu_users", JSON.stringify(existingUsers));
      localStorage.setItem("intervu_user", JSON.stringify(newUser));

      // If resume file exists, store it
      if (data.resumeFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const resumeData = e.target?.result;
          localStorage.setItem(
            `intervu_resume_${newUser.id}`,
            resumeData as string
          );
        };
        reader.readAsDataURL(data.resumeFile);
      }

      setUser(newUser);
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const existingUsers = JSON.parse(
        localStorage.getItem("intervu_users") || "[]"
      );

      const foundUser = existingUsers.find(
        (u: any) => u.email === email && u.password === password
      );

      if (!foundUser) {
        alert("Invalid email or password!");
        return false;
      }

      // Remove password from user object before storing
      const { password: _, ...userWithoutPassword } = foundUser;
      
      localStorage.setItem(
        "intervu_user",
        JSON.stringify(userWithoutPassword)
      );
      setUser(userWithoutPassword);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("intervu_user");
    setUser(null);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem("intervu_user", JSON.stringify(updatedUser));

    // Update in users array
    const existingUsers = JSON.parse(
      localStorage.getItem("intervu_users") || "[]"
    );
    const userIndex = existingUsers.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      existingUsers[userIndex] = { ...existingUsers[userIndex], ...data };
      localStorage.setItem("intervu_users", JSON.stringify(existingUsers));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
