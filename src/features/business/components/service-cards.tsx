import {
  Award,
  ClipboardCheck,
  Globe2,
  GraduationCap,
  Headset,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Radio,
  Route,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

/** Icon keys used by the service copy; unknown keys fall back to a neutral icon. */
const ICONS: Record<string, LucideIcon> = {
  route: Route,
  library: Library,
  diploma: GraduationCap,
  custom: Sparkles,
  live: Radio,
  consult: Headset,
  reports: LayoutDashboard,
  teams: Users,
  assessments: ClipboardCheck,
  certificate: Award,
  brand: Globe2,
  support: LifeBuoy,
};

export type ServiceItem = { icon: string; title: string; body: string };

function ServiceCard({ item }: { item: ServiceItem }) {
  const Icon = ICONS[item.icon] ?? Sparkles;
  return (
    <li className="b2b-service">
      <span aria-hidden="true" className="b2b-service__icon">
        <Icon className="size-5" />
      </span>
      <h4 className="b2b-service__title">{item.title}</h4>
      <p className="b2b-service__body">{item.body}</p>
    </li>
  );
}

/** A flat list of service cards (the `/business` preview). */
export function ServiceCards({
  items,
  className,
}: {
  items: readonly ServiceItem[];
  className?: string;
}) {
  return (
    <ul className={cn("b2b-service-grid", className)} data-b2b-stagger>
      {items.map((item) => (
        <ServiceCard key={item.title} item={item} />
      ))}
    </ul>
  );
}
