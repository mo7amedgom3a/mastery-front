"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { studioSections, type StudioBlock } from "@/features/product-detail/model/studio-content";
import { useStudioChannel } from "@/features/preview/use-studio-channel";

import { resolveProgramCards } from "../model/page-document";
import type { ExpertDetailData } from "../model/types";
import { ExpertBody } from "../sections/expert-body";

/**
 * The expert page body in the admin Studio preview, re-rendered on every `render` message: `blocks` is the page
 * being built (empty: none, so the default sections show) and `readme` the README being edited. `reload` (after a
 * profile save) refetches the page.
 */
export function LiveExpertBody({ data }: { data: ExpertDetailData }) {
  const router = useRouter();
  const [readme, setReadme] = useState(data.expert.readme);
  const [blocks, setBlocks] = useState<StudioBlock[] | null>(data.expert.document?.length ? data.expert.document : null);
  const index = useMemo(() => new Map(data.programs.map((card) => [card.slug, card])), [data.programs]);
  const page = useMemo(() => (blocks ? studioSections(resolveProgramCards(blocks, index)) : []), [blocks, index]);

  useStudioChannel((message) => {
    if (message.type === "render") {
      if (typeof message.readme === "string") setReadme(message.readme);
      if (Array.isArray(message.blocks)) setBlocks(message.blocks.length ? (message.blocks as StudioBlock[]) : null);
    }
    if (message.type === "reload") router.refresh();
  });

  return <ExpertBody data={data} page={page} readme={readme} />;
}
