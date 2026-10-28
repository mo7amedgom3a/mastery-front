"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { trackAdvisor } from "@/lib/observability/behavior";

import { advisorCopy } from "../content/copy";
import { ADVISOR_LAUNCHER_ID, ADVISOR_PANEL_ID } from "../model/ids";
import { rehydrateAdvisor, useAdvisorStore } from "../model/store";
import { AdvisorAgent } from "./advisor-agent";

// The chat itself (markdown, login form) loads the first time it is opened.
const AdvisorPanel = dynamic(() => import("./advisor-panel").then((module) => module.AdvisorPanel), { ssr: false });

/** Dashboards, sign-in and checkout have their own job; the advisor stays out of their way. */
const HIDDEN_SECTIONS = ["/students", "/expert", "/marketer", "/login", "/register", "/checkout", "/preview", "/egress"];

function isHidden(pathname: string): boolean {
  return HIDDEN_SECTIONS.some((section) => pathname === section || pathname.startsWith(`${section}/`));
}

/**
 * The AI advisor: a floating button on every public page that opens a chat with the agent. It lives
 * in the root layout, so an open conversation stays on screen while the visitor follows one of its
 * recommendations to a product page and back.
 */
export function AdvisorWidget() {
  const pathname = usePathname();
  const open = useAdvisorStore((state) => state.open);
  const mood = useAdvisorStore((state) => state.mood);
  const setOpen = useAdvisorStore((state) => state.setOpen);

  useEffect(() => {
    void rehydrateAdvisor();
  }, []);

  if (isHidden(pathname)) return null;

  const toggle = () => {
    if (!open) trackAdvisor("ai_advisor_opened");
    setOpen(!open);
  };

  return (
    <>
      <button
        id={ADVISOR_LAUNCHER_ID}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? ADVISOR_PANEL_ID : undefined}
        aria-label={open ? advisorCopy.closeLauncher : advisorCopy.launcher}
        title={advisorCopy.name}
        className="ma-advisor-launcher max-sm:data-[open=true]:hidden"
        data-open={open}
      >
        <AdvisorAgent variant="compact" mood={open ? mood : "idle"} className="size-full" />
      </button>
      {open ? <AdvisorPanel /> : null}
    </>
  );
}
