import {
  Award,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  Download,
  Gift,
  GraduationCap,
  Headset,
  Infinity as InfinityIcon,
  Layers,
  Library,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * Feature icons by the lucide name the admin picks (admin-dashboard
 * `src/features/subscriptions/feature-icons.ts` offers the same names).
 */
const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  bot: Bot,
  brain: Brain,
  video: Video,
  layers: Layers,
  library: Library,
  award: Award,
  users: Users,
  headset: Headset,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  calendar: Calendar,
  infinity: InfinityIcon,
  gift: Gift,
  rocket: Rocket,
  "shield-check": ShieldCheck,
  download: Download,
  "message-circle": MessageCircle,
  trophy: Trophy,
  briefcase: Briefcase,
};

export function FeatureIcon({ name }: { name: string | null }) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return (
    <span className="ma-plan__icon">
      <Icon aria-hidden="true" />
    </span>
  );
}
