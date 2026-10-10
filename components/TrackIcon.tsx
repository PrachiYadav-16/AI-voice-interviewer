import {
  BarChart3,
  Briefcase,
  Building2,
  Code2,
  Factory,
  Globe2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Lightbulb,
  Medal,
  Palette,
  ScrollText,
  Shield,
  Sparkles,
  TrainFront,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/lib/interview/types";

const TRACK_ICONS: Record<string, LucideIcon> = {
  "upsc-cse": Landmark,
  "state-psc": Building2,
  "defence-ssb": Shield,
  banking: Wallet,
  psu: Factory,
  ssc: ScrollText,
  railways: TrainFront,
  "teaching-research": GraduationCap,
  "international-public": Globe2,
  "government-custom": Landmark,
  software: Code2,
  "data-ai": BarChart3,
  design: Palette,
  "product-business": Lightbulb,
  "business-functions": Briefcase,
  "people-support": Users,
  "professional-fields": HeartPulse,
  leadership: Medal,
  "campus-general": GraduationCap,
  custom: Sparkles,
};

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  government: Landmark,
  private: Briefcase,
  custom: Sparkles,
};

export function TrackIcon({ id, className }: { id: string; className?: string }) {
  const Icon = TRACK_ICONS[id] ?? Briefcase;
  return <Icon className={className} aria-hidden />;
}

export function CategoryIcon({ id, className }: { id: CategoryId; className?: string }) {
  const Icon = CATEGORY_ICONS[id];
  return <Icon className={className} aria-hidden />;
}
