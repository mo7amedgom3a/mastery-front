import { clsx as cn } from "clsx";
import { useId } from "react";

import type { AgentMood } from "../model/types";

/** One wave of the brand mark, normalised to 46.97 × 58.71: each eye is one. */
const WAVE =
  "M 0 0 L 0 31.04 C 6.41 31.04 12.21 33.59 16.45 37.75 C 16.56 37.86 16.67 37.96 16.77 38.08 L 30.54 51.84 C 34.75 56.05 40.55 58.67 46.97 58.71 L 46.97 27.68 C 40.55 27.64 34.75 25.02 30.54 20.81 L 29.48 19.77 L 16.39 6.67 C 12.16 2.54 6.38 0 0 0 Z";
const MOUTH = "M 112 165 Q 120 169 128 165";
const SMILE = "M 108 164 Q 120 174 132 164";

type AdvisorAgentProps = {
  mood?: AgentMood;
  /**
   * `full`: the whole agent, for the panel. `compact`: the head only, without the fine detail
   * (scanline, grid, gloss, glow) that turns to noise below ~64px — for the launcher and avatars.
   */
  variant?: "full" | "compact";
  /** Spoken name; omitted, the drawing is decorative. */
  title?: string;
  className?: string;
};

/**
 * The AI advisor's brand mark: a robot whose eyes are the brand's two waves. Its mood is a class on
 * the root (`is-thinking`, `is-speaking`, …) that `styles/advisor.css` animates; with reduced motion
 * it stands still. Its gradients and glow are a deliberate exception to the kit's flat rule: it is the
 * agent's own character, not UI chrome.
 */
export function AdvisorAgent({ mood = "idle", variant = "full", title, className }: AdvisorAgentProps) {
  // Ids are per instance: the launcher and the panel avatar are on screen together.
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `ma-agent-${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const full = variant === "full";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={full ? "0 0 240 240" : "40 40 160 160"}
      className={cn("ma-agent", `is-${mood}`, className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={id("chassis")} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#edf2f7" />
        </linearGradient>
        <linearGradient id={id("visor")} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0c121e" />
          <stop offset="50%" stopColor="#070b13" />
          <stop offset="100%" stopColor="#020408" />
        </linearGradient>
        <linearGradient id={id("coral")} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7b6d" />
          <stop offset="100%" stopColor="#ff5442" />
        </linearGradient>
        {full ? (
          <>
            <linearGradient id={id("scan")} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(255 101 85 / 0)" />
              <stop offset="50%" stopColor="rgb(255 101 85 / 0.22)" />
              <stop offset="100%" stopColor="rgb(255 101 85 / 0)" />
            </linearGradient>
            <filter id={id("glow")} x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ff6555" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#ff6555" floodOpacity="0.6" />
            </filter>
          </>
        ) : null}
        <clipPath id={id("clip")}>
          <rect x="64" y="81" width="112" height="74" rx="26" ry="26" />
        </clipPath>
        <path id={id("wave")} d={WAVE} fill={url("coral")} />
      </defs>

      <g className="ma-agent__float">
        {full ? (
          <>
            <path d="M 86 182 C 86 176 154 176 154 182 L 160 196 C 160 200 80 200 80 196 Z" fill="#94a3b8" opacity="0.35" />
            <ellipse cx="120" cy="195" rx="34" ry="4" fill="#64748b" opacity="0.25" />
            <rect x="30" y="96" width="16" height="44" rx="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="35" y="103" width="6" height="30" rx="3" fill="#0f172a" />
            <circle className="ma-agent__led" cx="38" cy="118" r="3" fill="#ff6555" filter={url("glow")} />
            <rect x="194" y="96" width="16" height="44" rx="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="199" y="103" width="6" height="30" rx="3" fill="#0f172a" />
            <circle className="ma-agent__led" cx="202" cy="118" r="3" fill="#ff6555" filter={url("glow")} />
            <path d="M 115 56 L 115 44 C 115 41 125 41 125 44 L 125 56 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
            <circle className="ma-agent__led" cx="120" cy="40" r="3.5" fill="#ff6555" filter={url("glow")} />
          </>
        ) : null}

        <rect x="46" y="54" width="148" height="128" rx="42" ry="42" fill={url("chassis")} stroke="#e2e8f0" strokeWidth="2" />
        <rect x="61" y="78" width="118" height="80" rx="29" ry="29" fill="#1e293b" />
        <rect x="64" y="81" width="112" height="74" rx="26" ry="26" fill={url("visor")} />

        <g clipPath={url("clip")}>
          {full ? (
            <>
              <line x1="64" y1="105" x2="176" y2="105" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.3" />
              <line x1="64" y1="131" x2="176" y2="131" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.3" />
              <rect className="ma-agent__scan" x="64" y="81" width="112" height="26" fill={url("scan")} />
              <rect x="72" y="137" width="4.5" height="4.5" fill="#ff6555" opacity="0.5" />
              <rect x="163.5" y="90" width="4.5" height="4.5" fill="#ff6555" opacity="0.5" />
            </>
          ) : null}

          {/* Gaze, pulse (or speech) and blink each animate their own group, so none overrides another. */}
          <g className="ma-agent__gaze">
            <g className="ma-agent__pulse" filter={full ? url("glow") : undefined}>
              <g className="ma-agent__blink">
                <use href={`#${id("wave")}`} transform="translate(81, 102.5) scale(0.52)" />
                <use href={`#${id("wave")}`} transform="translate(135, 102.5) scale(0.52)" />
              </g>
            </g>
          </g>

          {full ? (
            <>
              <path d="M 70 85 C 92 82 148 82 170 85 C 160 97 80 97 70 85 Z" fill="#ffffff" opacity="0.12" />
              <circle cx="166" cy="88" r="1.5" fill="#ffffff" opacity="0.4" />
            </>
          ) : null}
        </g>

        <path
          className="ma-agent__mouth"
          d={mood === "joy" ? SMILE : MOUTH}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
