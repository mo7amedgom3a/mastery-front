import { Building2, Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";

const PERKS = [
  "سعر خاص حسب حجم فريقك",
  "مسارات تدريب مصممة لأقسام شركتك",
  "مدير حساب مخصص وتقارير تقدّم للفريق",
  "فوترة سنوية أو ربع سنوية بفاتورة رسمية",
];

/** The pricing page's company tier above the self-serve plans: no price, a request to the business team. */
export function ContactSalesCard({ fromSeats = 50 }: { fromSeats?: number }) {
  return (
    <article className="ma-plan h-full" aria-labelledby="plan-contact-sales">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ma-tag ma-tag--soft">لفرق من {fromSeats} موظفاً فأكثر</span>
        </div>
        <h3 id="plan-contact-sales" className="m-0 flex items-center gap-2 text-2xl leading-9 font-bold">
          <Building2 aria-hidden="true" className="size-6 fill-none text-accent" />
          الشركات الكبيرة
        </h3>
        <p className="m-0 leading-7 text-fg-muted">
          نصمم لكم باقة على مقاس فريقكم وأهدافكم، ونرسل عرض السعر خلال يوم عمل.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="m-0 text-3xl leading-10 font-bold">تواصل معنا</p>
        <p className="ma-plan__unit">سعر حسب حجم الفريق ومدة الاشتراك</p>
      </div>

      <ul className="ma-plan__features" aria-label="ماذا تحصل">
        {PERKS.map((perk) => (
          <li key={perk}>
            <span className="ma-plan__icon">
              <Check aria-hidden="true" />
            </span>
            <span className="pt-1">{perk}</span>
          </li>
        ))}
      </ul>

      <div className="ma-plan__cta flex flex-col gap-2">
        <ButtonLink href={`${routes.businessRequest("company")}?teamSize=${fromSeats}` as typeof routes.business} variant="secondary" block>
          اطلب عرض سعر لشركتك
        </ButtonLink>
      </div>
    </article>
  );
}
