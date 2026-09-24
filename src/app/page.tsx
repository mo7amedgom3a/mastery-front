import { HelloWorld } from "@/features/home/components/hello-world";
import { getHealth } from "@/lib/api/health";
import type { HealthResponse } from "@/types/api";

export default async function HomePage() {
  let health: HealthResponse | null = null;

  try {
    health = await getHealth();
  } catch {
    // The page remains available while the backend is starting or offline.
  }

  return <HelloWorld health={health} />;
}
