"use client";

import { clsx as cn } from "clsx";
import { ArrowLeft, CheckCircle2, Eye, RotateCcw, Timer, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppLink } from "@/components/ui/app-link";
import { routes } from "@/config/routes";

import {
  DEMO_BREAKPOINT,
  DEMO_TURNS,
  demoInitial,
  demoLab,
  demoNodes,
  demoPersona,
  type DemoChoice,
  type DemoMeters,
  type DemoNodeId,
} from "../content/labs-showcase";

type Message =
  | { id: string; from: "customer"; text: string }
  | { id: string; from: "agent"; text: string; note: DemoChoice["note"] };

type Phase = "idle" | "typing" | "choosing" | "done";

const TYPING_MS = 1100;
const CLOCK_START = 10 * 60;

const clamp = (n: number) => Math.max(0, Math.min(100, n));

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Teaser score from how far the meters moved (best path ≈ 94, posting publicly ≈ 18). */
function scoreOf(meters: DemoMeters, good: number, turns: number) {
  const trustGain = meters.trust - demoInitial.trust;
  const tensionDrop = demoInitial.tension - meters.tension;
  const score = Math.round(Math.max(5, Math.min(98, 50 + trustGain * 1.2 + tensionDrop * 0.8)));
  return {
    score,
    skills: [
      { label: "الذكاء العاطفي", value: clamp(100 - meters.tension) },
      { label: "بناء الثقة", value: clamp(meters.trust * 2.2) },
      { label: "اتخاذ القرار", value: turns ? Math.round((good / turns) * 100) : 0 },
    ],
  };
}

/**
 * A playable slice of the support lab, right on the landing page: «أم فيصل» complains, the visitor
 * picks a reply, the tension/trust meters react, the observer comments, and after two turns a mini
 * scorecard hands over to the full lab. Starts when scrolled into view; the clock only ticks while
 * the console is visible. Reduced motion: no typing delay, no animations.
 */
export function LabsDemoConsole() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [node, setNode] = useState<DemoNodeId>("open");
  const [meters, setMeters] = useState<DemoMeters>(demoInitial);
  const [bumped, setBumped] = useState<keyof DemoMeters | null>(null);
  const [turns, setTurns] = useState(0);
  const [good, setGood] = useState(0);
  const [failed, setFailed] = useState(false);
  const [clock, setClock] = useState(CLOCK_START);
  const [inView, setInView] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const seq = useRef(0);
  const started = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => {
    if (ms <= 0 || reducedMotion()) {
      fn();
      return;
    }
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Typing dots, then the customer's line; `then` decides the phase after it lands. */
  const customerSays = useCallback(
    (id: DemoNodeId, then: Phase) => {
      setPhase("typing");
      later(() => {
        seq.current += 1;
        setMessages((list) => [...list, { id: `c${seq.current}`, from: "customer", text: demoNodes[id].line }]);
        setPhase(then);
      }, TYPING_MS);
    },
    [later],
  );

  const start = useCallback(() => {
    customerSays("open", "choosing");
  }, [customerSays]);

  // Track visibility; the conversation begins the first time the console is on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          start();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [start]);

  // The lab clock runs only while the visitor can see it and the round is still open.
  useEffect(() => {
    if (!inView || phase === "idle" || phase === "done") return;
    const id = window.setInterval(() => setClock((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [inView, phase]);

  // Keep the newest message in view inside the log (never scrolls the page).
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, phase]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const choose = (choice: DemoChoice) => {
    if (phase !== "choosing") return;
    seq.current += 1;
    setMessages((list) => [...list, { id: `a${seq.current}`, from: "agent", text: choice.label, note: choice.note }]);

    const next: DemoMeters = {
      tension: clamp(meters.tension + (choice.effects.tension ?? 0)),
      trust: clamp(meters.trust + (choice.effects.trust ?? 0)),
    };
    setMeters(next);
    const moved = Math.abs(choice.effects.tension ?? 0) >= Math.abs(choice.effects.trust ?? 0) ? "tension" : "trust";
    setBumped(moved);
    later(() => setBumped(null), 650);

    const turn = turns + 1;
    setTurns(turn);
    if (choice.note.tone === "good") setGood((n) => n + 1);

    const blewUp = next.tension >= DEMO_BREAKPOINT || choice.next === "public";
    const target: DemoNodeId = blewUp ? "public" : choice.next;
    setFailed(blewUp);
    setNode(target);
    const continues = !blewUp && turn < DEMO_TURNS && Boolean(demoNodes[target].choices);
    customerSays(target, continues ? "choosing" : "done");
  };

  const reset = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setMessages([]);
    setNode("open");
    setMeters(demoInitial);
    setTurns(0);
    setGood(0);
    setFailed(false);
    setClock(CLOCK_START);
    customerSays("open", "choosing");
  };

  const choices = phase === "choosing" ? (demoNodes[node].choices ?? []) : [];
  const result = phase === "done" ? scoreOf(meters, good, turns) : null;
  const mm = String(Math.floor(clock / 60)).padStart(2, "0");
  const ss = String(clock % 60).padStart(2, "0");

  return (
    <div
      ref={rootRef}
      className="flex flex-col overflow-hidden rounded-panel border border-line-strong bg-surface text-fg shadow-[0_30px_80px_-30px_color-mix(in_srgb,var(--coral)_45%,transparent)]"
    >
      {/* Window chrome: the lab's title bar. */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="relative flex size-2.5 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-coral opacity-60 motion-reduce:animate-none" />
            <span className="relative size-2.5 rounded-full bg-coral" />
          </span>
          <span className="truncate text-sm font-bold">{demoLab.title}</span>
          <span className="hidden rounded-full bg-(--fill-soft) px-2 py-0.5 text-xs text-fg-muted sm:inline">محاكاة مباشرة</span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-(--fill-soft) px-2.5 py-1 text-xs font-semibold tabular-nums">
          <Timer aria-hidden="true" className="size-3.5" />
          <span className="sr-only">الوقت المتبقي</span>
          <span dir="ltr">
            {mm}:{ss}
          </span>
        </span>
      </div>

      {/* Meters: the consequences of every reply, live. */}
      <div className="grid grid-cols-2 gap-4 border-b border-line px-4 py-3">
        <Meter label="التوتر" value={meters.tension} tone={meters.tension >= 80 ? "bg-pink" : meters.tension >= 50 ? "bg-yellow" : "bg-green"} bumped={bumped === "tension"} />
        <Meter label="الثقة" value={meters.trust} tone="bg-sky" bumped={bumped === "trust"} />
      </div>

      {/* Conversation log. */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={`محادثة مع ${demoPersona.name}`}
        className="flex h-[22rem] flex-col gap-3 overflow-y-auto px-4 py-4 sm:h-[24rem]"
      >
        <p className="m-0 rounded-ctl bg-(--fill-soft) px-3 py-2 text-xs leading-5 text-fg-muted">{demoLab.brief}</p>
        {messages.map((message) =>
          message.from === "customer" ? (
            <div key={message.id} className="ma-labs-enter flex max-w-[88%] items-end gap-2 self-start">
              <span aria-hidden="true" className="ma-avatar size-8 shrink-0 bg-pink text-xs text-ink">
                {demoPersona.initials}
              </span>
              <div className="rounded-2xl rounded-ee-sm bg-(--fill-soft) px-3.5 py-2.5">
                <p className="m-0 text-xs font-bold text-fg-muted">{demoPersona.name}</p>
                <p className="m-0 mt-0.5 text-sm leading-6">{message.text}</p>
              </div>
            </div>
          ) : (
            <div key={message.id} className="ma-labs-enter flex max-w-[88%] flex-col items-end gap-1.5 self-end">
              <div className="rounded-2xl rounded-es-sm bg-accent px-3.5 py-2.5 text-ink">
                <p className="m-0 text-xs font-bold opacity-70">أنت</p>
                <p className="m-0 mt-0.5 text-sm leading-6">{message.text}</p>
              </div>
              <p
                className={cn(
                  "ma-labs-enter m-0 inline-flex items-start gap-1.5 rounded-ctl border px-2.5 py-1.5 text-xs leading-5 [animation-delay:250ms]",
                  message.note.tone === "good" ? "border-green/60 bg-green/10" : "border-pink/60 bg-pink/10",
                )}
              >
                <Eye aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <span className="font-bold">المراقب: </span>
                  {message.note.text}
                </span>
              </p>
            </div>
          ),
        )}
        {phase === "typing" ? (
          <div className="flex items-center gap-2 self-start text-fg-muted">
            <span aria-hidden="true" className="ma-avatar size-8 bg-pink text-xs text-ink">
              {demoPersona.initials}
            </span>
            <span className="ma-labs-typing rounded-2xl bg-(--fill-soft) px-3.5 py-3" aria-label={`${demoPersona.name} تكتب`}>
              <span />
              <span />
              <span />
            </span>
          </div>
        ) : null}
      </div>

      {/* Reply choices, or the mini scorecard once the round ends. */}
      <div className="border-t border-line bg-surface-alt/60 px-4 py-4">
        {result ? (
          <div className="ma-labs-enter flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "grid size-16 shrink-0 place-content-center rounded-full text-2xl font-bold tabular-nums text-ink",
                  result.score >= 75 ? "bg-green" : result.score >= 45 ? "bg-yellow" : "bg-pink",
                )}
              >
                {result.score}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="m-0 inline-flex items-center gap-1.5 text-base font-bold">
                  {failed ? <XCircle aria-hidden="true" className="size-4 text-pink" /> : <CheckCircle2 aria-hidden="true" className="size-4 text-green" />}
                  {failed ? "نشرت العميلة الشكوى علنًا" : result.score >= 75 ? "بداية ممتازة، العميلة بدأت تهدأ" : "نجوت، لكن الثقة ما زالت هشة"}
                </p>
                <p className="m-0 text-sm text-fg-muted">هذه دقيقتان فقط. المختبر الكامل فيه التذكرة والتعويض والتوثيق وتقييم كامل.</p>
              </div>
            </div>
            <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
              {result.skills.map((skill) => (
                <li key={skill.label} className="flex flex-col gap-1">
                  <span className="flex justify-between text-xs">
                    <span>{skill.label}</span>
                    <span className="tabular-nums">{skill.value}</span>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-(--fill-soft)">
                    <span className="ma-labs-meter__fill block h-full rounded-full bg-accent" style={{ width: `${skill.value}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <AppLink href={routes.lab(demoLab.slug)} className="ma-btn ma-btn--primary">
                أكمل المختبر كاملًا
                <ArrowLeft aria-hidden="true" className="ma-icon-dir size-4" />
              </AppLink>
              <button type="button" onClick={reset} className="ma-btn ma-btn--soft">
                <RotateCcw aria-hidden="true" className="size-4" />
                أعد المحاولة
              </button>
            </div>
          </div>
        ) : (
          <div role="group" aria-label="اختر ردّك" className="flex flex-col gap-2">
            <p className="m-0 text-xs font-bold text-fg-muted">
              {phase === "choosing" ? `اختر ردّك (${turns + 1} من ${DEMO_TURNS})` : `${demoPersona.name} تكتب…`}
            </p>
            {choices.length ? (
              choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => choose(choice)}
                  className="ma-labs-enter w-full rounded-ctl border border-line bg-surface px-3.5 py-2.5 text-start text-sm leading-6 transition-colors hover:border-line-strong hover:bg-(--fill-soft) focus-visible:border-line-strong"
                >
                  {choice.label}
                </button>
              ))
            ) : (
              <div aria-hidden="true" className="flex flex-col gap-2">
                <span className="block h-11 rounded-ctl bg-(--fill-soft)" />
                <span className="block h-11 rounded-ctl bg-(--fill-soft) opacity-60" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Meter({ label, value, tone, bumped }: { label: string; value: number; tone: string; bumped: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-xs font-semibold">
        <span>{label}</span>
        <span className={cn("inline-block tabular-nums", bumped && "ma-labs-bump")}>{value}</span>
      </span>
      <span
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-(--fill-soft)"
      >
        <span className={cn("ma-labs-meter__fill block h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}
