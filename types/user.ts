/**
 * User authentication and profile types
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  resumeFile?: File | null;
  resumeFileName?: string;
  resumeUrl?: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  isAuthenticated: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  resumeFile?: File;
}

export interface LoginData {
  email: string;
  password: string;
}

// Default avatar options
export const DEFAULT_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
];
