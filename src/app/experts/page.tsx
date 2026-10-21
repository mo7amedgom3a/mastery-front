import type { Metadata } from "next";

import { routes } from "@/config/routes";
import { baseOpenGraph } from "@/config/site";
import { getExpertCards } from "@/features/experts-directory/api/get-expert-cards";
import { ExpertsDirectoryPage } from "@/features/experts-directory/experts-directory-page";
import { directoryHref, parseDirectoryState } from "@/features/experts-directory/model";

const title = "المدربون والخبراء";
const description = "تعرّف على مدربي وخبراء ماستري: مجالاتهم، دوراتهم ودبلوماتهم وباقاتهم، والاستشارات الفردية التي يقدّمونها.";

export async function generateMetadata({ searchParams }: PageProps<"/experts">): Promise<Metadata> {
  const state = parseDirectoryState(await searchParams);
  // Filtered views are for visitors; search engines get the one canonical directory.
  const filtered = directoryHref(state) !== routes.experts;
  return {
    title,
    description,
    alternates: { canonical: routes.experts, languages: { ar: routes.experts, "x-default": routes.experts } },
    openGraph: { ...baseOpenGraph, url: routes.experts, title, description },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ExpertsRoute({ searchParams }: PageProps<"/experts">) {
  const [state, experts] = await Promise.all([searchParams.then(parseDirectoryState), getExpertCards()]);
  return <ExpertsDirectoryPage experts={experts} state={state} />;
}
