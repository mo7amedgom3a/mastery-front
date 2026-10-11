"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { routes } from "@/config/routes";
import type { OnboardingOptionsResponse } from "@/lib/api/catalog";
import { customerKeys } from "@/lib/api/customers";
import { recommendationKeys } from "@/lib/api/recommendations";
import { useAuthStore } from "@/lib/auth/store";

import { ChoiceChip } from "../components/choice-chip";
import { StepFrame } from "../components/step-frame";
import { productTypeLabel, tagLabel } from "../model/labels";
import { toggleId, useOnboardingStore } from "../model/onboarding-store";
import { clearOnboardingSkip } from "../model/skip";
import { submitOnboarding } from "../model/submit";

/** Topics and kinds of programme the customer likes (optional), then saves everything. */
export function PreferencesStep({ options }: { options: OnboardingOptionsResponse }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useAuthStore((state) => state.user?.customer_id ?? null);
  const tags = useOnboardingStore((state) => state.tags);
  const productTypes = useOnboardingStore((state) => state.productTypes);
  const update = useOnboardingStore((state) => state.update);

  const save = useMutation({
    mutationFn: () => submitOnboarding(useOnboardingStore.getState()),
    onSuccess: async () => {
      if (customerId) clearOnboardingSkip(customerId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: recommendationKeys.all }),
      ]);
      router.push(routes.studentOnboardingStart);
      useOnboardingStore.getState().reset();
    },
  });

  return (
    <StepFrame
      step="preferences"
      title="ما الذي يثير اهتمامك؟"
      lead="اختياري: اختر المواضيع وأنواع البرامج التي تفضّلها."
      canContinue
      onNext={() => save.mutate()}
      nextLabel="أنهِ وأرني اقتراحاتي"
      pending={save.isPending}
      error={save.isError ? "تعذّر حفظ إجاباتك. تحقّق من اتصالك ثم حاول مجدداً." : null}
    >
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 p-0 font-bold">المواضيع</legend>
        <div className="flex flex-wrap gap-2">
          {(options.tags ?? []).map((tag) => (
            <ChoiceChip
              key={tag.tag}
              selected={tags.includes(tag.tag)}
              onToggle={() => update({ tags: toggleId(tags, tag.tag) })}
            >
              {tagLabel(tag.tag)}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 p-0 font-bold">أنواع البرامج</legend>
        <div className="flex flex-wrap gap-2">
          {(options.product_types ?? []).map((type) => (
            <ChoiceChip
              key={type.code}
              selected={productTypes.includes(type.code)}
              onToggle={() => update({ productTypes: toggleId(productTypes, type.code) })}
            >
              {productTypeLabel(type.code, type.name)}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
    </StepFrame>
  );
}
