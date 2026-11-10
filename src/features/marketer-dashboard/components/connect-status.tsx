import type { MarketerConnectStatus } from "@/lib/api/marketer";
import { cn } from "@/lib/cn";

export const CONNECT_STATUS: Record<
  MarketerConnectStatus,
  { label: string; tone: string; hint: string }
> = {
  none: {
    label: "غير مربوط",
    tone: "ma-tag--soft",
    hint: "اختر بلد حسابك البنكي واربطه عبر Stripe لتصلك أرباحك تلقائيًا. لا نحتاج منك أي طلب صرف.",
  },
  onboarding: {
    label: "بانتظار إكمال البيانات",
    tone: "ma-tag--sky",
    hint: "أكمل بياناتك على Stripe (الهوية والحساب البنكي) ليصبح الحساب جاهزًا لاستلام التحويلات.",
  },
  enabled: {
    label: "جاهز لاستلام التحويلات",
    tone: "ma-tag--green",
    hint: "حسابك جاهز. نحوّل رصيدك تلقائيًا في أول كل شهر متى بلغ الحد الأدنى.",
  },
  restricted: {
    label: "يحتاج إلى مراجعة",
    tone: "ma-tag--soft",
    hint: "طلبت Stripe معلومات إضافية. أكمِلها ليستأنف التحويل؛ رصيدك محفوظ لديك.",
  },
  unsupported: {
    label: "غير متاح في بلدك",
    tone: "ma-tag--soft",
    hint: "لا يدعم Stripe التحويل إلى حسابات بنكية في هذا البلد بعد. تواصل مع فريق ماستري لترتيب طريقة أخرى؛ رصيدك محفوظ لديك.",
  },
};

export function ConnectTag({
  status,
  className,
}: {
  status: MarketerConnectStatus;
  className?: string;
}) {
  const meta = CONNECT_STATUS[status] ?? CONNECT_STATUS.none;
  return (
    <span className={cn("ma-tag text-xs", meta.tone, className)}>
      {meta.label}
    </span>
  );
}
