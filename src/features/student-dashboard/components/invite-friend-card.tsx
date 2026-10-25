"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Gift } from "lucide-react";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { referralQueries } from "@/lib/api/referrals";
import { fromMinor } from "@/lib/format";

/** Home-page nudge for the invite-a-friend program; hidden while the program is closed. */
export function InviteFriendCard() {
  const me = useQuery(referralQueries.me());
  const [copied, setCopied] = useState(false);
  const data = me.data;
  if (!data || !data.program_active) return null;

  return (
    <section
      aria-labelledby="invite-friend-title"
      className="flex flex-col gap-4 rounded-panel border border-line-strong bg-surface p-5 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-start gap-3">
        <Gift aria-hidden="true" className="mt-1 size-6 shrink-0 fill-none text-accent" />
        <div className="flex flex-col gap-1">
          <h2 id="invite-friend-title" className="m-0 text-lg font-bold">
            ادعُ صديقًا واربح <Money amount={fromMinor(data.reward_minor)} />
          </h2>
          <p className="m-0 text-sm leading-6 text-fg-muted">
            {data.joined ? (
              <>
                سجّل {data.invited} واشترى {data.qualified} عبر رابطك · ربحت <Money amount={fromMinor(data.earned_minor)} />
              </>
            ) : (
              `يحصل صديقك على خصم ${Number(data.friend_discount_percent)}% على أول شراء، وتحصل أنت على قسيمة رصيد.`
            )}
          </p>
        </div>
      </div>
      {data.joined && data.link ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ma-btn ma-btn--primary gap-2"
            onClick={() => {
              void navigator.clipboard?.writeText(data.link ?? "");
              setCopied(true);
            }}
          >
            {copied ? <Check aria-hidden="true" className="size-4 fill-none" /> : <Copy aria-hidden="true" className="size-4 fill-none" />}
            {copied ? "تم نسخ رابطك" : "انسخ رابط الدعوة"}
          </button>
          <ButtonLink href={routes.studentReferrals} variant="soft">
            التفاصيل
          </ButtonLink>
        </div>
      ) : (
        <ButtonLink href={routes.studentReferrals} variant="primary">
          احصل على رابطك
        </ButtonLink>
      )}
    </section>
  );
}
