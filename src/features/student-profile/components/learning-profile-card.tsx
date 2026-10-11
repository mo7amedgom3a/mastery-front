"use client";

import { CalendarClock, Compass, Gauge, PencilLine, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { LEVEL_LABELS, productTypeLabel, tagLabel } from "@/features/onboarding/model/labels";
import type { OnboardingAnswers } from "@/features/onboarding/model/onboarding-store";
import { prefillOnboarding } from "@/features/onboarding/model/prefill";
import { ONBOARDING_STEPS } from "@/features/onboarding/model/steps";
import type { OnboardingOptionsResponse } from "@/lib/api/catalog";

function Chips({ items, empty, tone = "soft" }: { items: string[]; empty: string; tone?: "soft" | "yellow" | "green" }) {
  if (items.length === 0) return <p className="m-0 text-sm text-fg-muted">{empty}</p>;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      {items.map((item) => (
        <li key={item} className={`ma-tag ma-tag--${tone}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-alt">
        <Icon className="size-5 fill-none text-accent" />
      </span>
      <div className="flex min-w-0 flex-col">
        <dt className="text-sm text-fg-muted">{label}</dt>
        <dd className="m-0 font-bold break-words">{value}</dd>
      </div>
    </div>
  );
}

type LearningProfileCardProps = {
  answers: OnboardingAnswers;
  options: OnboardingOptionsResponse | undefined;
  completed: boolean;
};

/** What the customer told us while onboarding, and the way back in to change it. */
export function LearningProfileCard({ answers, options, completed }: LearningProfileCardProps) {
  const router = useRouter();
  const skills = options?.skills ?? [];
  const skillName = (id: string) => skills.find((skill) => skill.skill_id.toLowerCase() === id.toLowerCase())?.name;
  const names = (ids: string[]) => ids.map(skillName).filter((name): name is string => Boolean(name));
  const domain = skills.find((skill) => skill.slug === answers.domain)?.name ?? answers.domain;
  const typeName = (code: string) =>
    productTypeLabel(code, options?.product_types?.find((type) => type.code === code)?.name);

  const edit = () => {
    prefillOnboarding(answers);
    router.push(routes.studentOnboarding(ONBOARDING_STEPS[0].id));
  };

  if (!completed) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="m-0 max-w-[55ch] leading-7 text-fg-muted">
          لم تُكمل ملفك التعليمي بعد. أخبرنا بأهدافك والمهارات التي تريد اكتسابها لنقترح عليك ما يناسبك.
        </p>
        <ButtonLink href={routes.studentOnboarding()} variant="primary">
          ابنِ ملفك التعليمي
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <dl className="m-0 grid gap-5 sm:grid-cols-2">
        <Fact icon={Target} label="هدفك" value={answers.goal || "—"} />
        <Fact icon={Compass} label="المجال" value={domain || "—"} />
        <Fact icon={Gauge} label="مستواك" value={answers.level ? (LEVEL_LABELS[answers.level]?.label ?? answers.level) : "—"} />
        <Fact
          icon={CalendarClock}
          label="وقت التعلّم اليومي"
          value={answers.dailyMinutes ? `${answers.dailyMinutes} دقيقة` : "—"}
        />
      </dl>

      <section aria-labelledby="gap-skills-title" className="flex flex-col gap-3">
        <h3 id="gap-skills-title" className="m-0 text-base font-bold">
          مهارات تريد اكتسابها
        </h3>
        <Chips items={names(answers.targetSkillIds)} empty="لم تختر مهارات بعد." tone="yellow" />
      </section>
      <section aria-labelledby="strength-skills-title" className="flex flex-col gap-3">
        <h3 id="strength-skills-title" className="m-0 text-base font-bold">
          مهارات تتقنها
        </h3>
        <Chips items={names(answers.currentSkillIds)} empty="لم تحدّد مهارات تتقنها." tone="green" />
      </section>
      <section aria-labelledby="interests-title" className="flex flex-col gap-3">
        <h3 id="interests-title" className="m-0 text-base font-bold">
          اهتماماتك
        </h3>
        <Chips
          items={[...answers.tags.map(tagLabel), ...answers.productTypes.map(typeName)]}
          empty="لم تحدّد مواضيع أو أنواع برامج مفضّلة."
        />
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <Button variant="soft" className="gap-2" onClick={edit}>
          <PencilLine aria-hidden="true" className="size-5 fill-none" />
          عدّل إجاباتك
        </Button>
        <p className="m-0 text-sm text-fg-muted">سنحدّث اقتراحاتك فور حفظ التعديلات.</p>
      </div>
    </div>
  );
}
