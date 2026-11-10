"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Gift } from "lucide-react";
import { useState } from "react";

import { Money } from "@/components/shop/money";
import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { referralQueries } from "@/lib/api/referrals";
import { formatNumber, fromMinor } from "@/lib/format";

/** Home-page nudge for the invite-a-friend program; hidden while the program is closed. */
export function InviteFriendCard() {
  const me = useQuery(referralQueries.me());
  const [copied, setCopied] = useState(false);
  const data = me.data;
  if (!data || !data.program_active) return null;

  return (
    <section
      aria-labelledby="invite-friend-title"
      data-theme="dark"
      className="flex flex-col gap-3 rounded-panel border border-line bg-ink p-5 text-fg"
    >
      <div className="flex items-start gap-3">
        <Gift aria-hidden="true" className="mt-1 size-5 shrink-0 fill-none text-accent" />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="invite-friend-title" className="m-0 text-lg leading-7 font-bold">
            ادعُ صديقًا واربح <Money amount={fromMinor(data.reward_minor)} />
          </h2>
          <p className="m-0 text-sm leading-6 text-fg-muted">
            {data.joined ? (
              <>
                سجّل {formatNumber(data.invited)} واشترى {formatNumber(data.qualified)} عبر رابطك · ربحت{" "}
                <b className="text-fg">
                  <Money amount={fromMinor(data.earned_minor)} />
                </b>
              </>
            ) : (
              `يحصل صديقك على خصم ${formatNumber(Number(data.friend_discount_percent))}% على أول شراء، وتحصل أنت على قسيمة رصيد.`
            )}
          </p>
        </div>
      </div>
      {data.joined && data.link ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ma-btn ma-btn--primary ma-btn--sm gap-2"
            onClick={() => {
              void navigator.clipboard?.writeText(data.link ?? "");
              setCopied(true);
            }}
          >
            {copied ? <Check aria-hidden="true" className="size-4 fill-none" /> : <Copy aria-hidden="true" className="size-4 fill-none" />}
            {copied ? "تم نسخ رابطك" : "انسخ رابط الدعوة"}
          </button>
          <ButtonLink href={routes.studentReferrals} variant="soft" size="sm">
            التفاصيل
          </ButtonLink>
        </div>
      ) : (
        <ButtonLink href={routes.studentReferrals} variant="primary" size="sm" className="self-start">
          احصل على رابطك
        </ButtonLink>
      )}
    </section>
  );
}
