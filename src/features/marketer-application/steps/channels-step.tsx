"use client";

import { useId } from "react";

import { PlatformLinks } from "@/features/marketers/components/platform-links";

import { ApplyFrame } from "../components/apply-frame";
import { useApplyStore } from "../model/apply-store";

export function ChannelsStep() {
  const id = useId();
  const { platforms, errors, update } = useApplyStore();
  return (
    <ApplyFrame
      step="channels"
      title="أين تتواجد رقميًا؟"
      lead="أجب عن كل منصة، وأضف رابط حسابك في المنصات التي تستخدمها. يمكنك المتابعة حتى لو لم تكن لديك حسابات."
    >
      <PlatformLinks baseId={id} value={platforms} errors={errors.linkErrors ?? {}} onChange={(next) => update({ platforms: next })} />
    </ApplyFrame>
  );
}
