"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Hourglass,
  Landmark,
  Wallet,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Money } from "@/components/shop/money";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import {
  MARKETER_PAGE_SIZE,
  getMarketerPayoutAccount,
  marketerKeys,
  marketerQueries,
  openMarketerStripeDashboard,
  refreshMarketerConnect,
  startMarketerConnect,
  type MarketerBalance,
  type MarketerPayout,
} from "@/lib/api/marketer";
import { cn } from "@/lib/cn";
import { formatDate, fromMinor } from "@/lib/format";

/** Bank-account countries offered first (the program's main markets), then the rest. */
const PAYOUT_COUNTRIES = [
  "EG", "SA", "AE", "GB", "KW", "QA", "BH", "OM", "JO", "MA", "TN", "DZ", "TR", "US", "CA", "DE", "FR", "NL",
  "IE", "ES", "IT",
] as const;

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["ar"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const ROUTE_LABEL: Record<string, string> = {
  connect: "تحويل إلى رصيدك على Stripe، ثم إلى بنكك تلقائيًا",
  global: "تحويل بنكي مباشر إلى حسابك (SWIFT)",
};

function creditedAmount(payout: MarketerPayout): string | null {
  if (payout.credited_minor == null || !payout.credited_currency || payout.credited_currency === payout.currency_code)
    return null;
  try {
    return new Intl.NumberFormat("ar", { style: "currency", currency: payout.credited_currency }).format(
      payout.credited_minor / 100,
    );
  } catch {
    return `${(payout.credited_minor / 100).toFixed(2)} ${payout.credited_currency}`;
  }
}

import { CONNECT_STATUS, ConnectTag } from "./components/connect-status";
import {
  LoadError,
  PAYOUT_STATUS,
  Pager,
  StatTile,
  StatusTag,
} from "./components/shared";

function connectErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail =
      typeof error.details.detail === "string" ? error.details.detail : "";
    if (detail === "country_required")
      return "اختر بلد حسابك البنكي أولًا.";
    if (detail === "country_unsupported")
      return "لا يدعم Stripe التحويل إلى حسابات بنكية في هذا البلد بعد. تواصل مع فريق ماستري لترتيب طريقة أخرى.";
    if (error.status === 503)
      return "التحويلات غير مفعّلة حاليًا. حاول لاحقًا.";
  }
  return "تعذّر فتح Stripe الآن. حاول مرة أخرى بعد قليل.";
}

function PayoutAccountCard({ balance }: { balance: MarketerBalance }) {
  const queryClient = useQueryClient();
  const status = balance.connect_status;
  const meta = CONNECT_STATUS[status] ?? CONNECT_STATUS.none;
  const [error, setError] = useState<string | null>(null);
  const profile = useQuery(marketerQueries.profile());
  const [country, setCountry] = useState<string>("");
  const selectedCountry = country || profile.data?.partner.country_code || "";
  const needsCountry = balance.payout_provider === "none" && (status === "none" || status === "unsupported");
  const provider = balance.payout_provider;
  const account = useQuery({
    queryKey: [...marketerKeys.all, "payout-account"],
    queryFn: ({ signal }) => getMarketerPayoutAccount({ signal }),
    enabled: status === "onboarding" || status === "restricted",
    staleTime: 30_000,
  });
  const missing = account.data?.requirements.length ?? 0;

  const connect = useMutation({
    mutationFn: () => startMarketerConnect(needsCountry ? selectedCountry : undefined),
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (e) => {
      setError(connectErrorMessage(e));
      // e.g. country_unsupported: the account state changed on the server.
      void queryClient.invalidateQueries({ queryKey: marketerKeys.balance() });
    },
  });
  const dashboard = useMutation({
    mutationFn: () => openMarketerStripeDashboard(),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (e) => setError(connectErrorMessage(e)),
  });
  const refresh = useMutation({
    mutationFn: () => refreshMarketerConnect(),
    onSuccess: (data) => {
      queryClient.setQueryData(marketerKeys.balance(), data);
      void account.refetch();
    },
  });

  const busy = connect.isPending || dashboard.isPending;

  return (
    <section
      aria-labelledby="payout-account-title"
      className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="payout-account-title"
          className="m-0 inline-flex items-center gap-2 text-lg font-bold"
        >
          <Landmark aria-hidden="true" className="size-5" /> حساب استلام الأرباح
        </h2>
        <ConnectTag status={status} />
      </div>
      <p className="m-0 text-sm text-fg-muted">{meta.hint}</p>
      {provider !== "none" ? (
        <dl className="m-0 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
          <dt className="text-fg-muted">طريقة الاستلام</dt>
          <dd className="m-0">{ROUTE_LABEL[provider] ?? provider}</dd>
          {balance.payout_method_label ? (
            <>
              <dt className="text-fg-muted">الحساب البنكي</dt>
              <dd className="m-0">
                <bdi dir="ltr">{balance.payout_method_label}</bdi>
                {balance.payout_currency ? ` · ${balance.payout_currency}` : null}
              </dd>
            </>
          ) : null}
          {missing > 0 ? (
            <>
              <dt className="text-fg-muted">المطلوب</dt>
              <dd className="m-0">{missing === 1 ? "بيان واحد" : `${missing} بيانات`} لإكمال الحساب</dd>
            </>
          ) : null}
        </dl>
      ) : null}
      {needsCountry ? (
        <label className="flex max-w-sm flex-col gap-1 text-sm">
          <span className="font-semibold">بلد حسابك البنكي</span>
          <select
            className="ma-input"
            value={selectedCountry}
            onChange={(e) => {
              setCountry(e.target.value);
              setError(null);
            }}
          >
            <option value="">اختر البلد</option>
            {PAYOUT_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {balance.payout_hold ? (
        <p className="ma-alert ma-alert--info m-0 text-sm" role="note">
          التحويلات لحسابك متوقفة مؤقتًا للمراجعة. رصيدك محفوظ وستصلك أرباحك فور
          انتهائها.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="m-0 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {status === "enabled" ? (
          <Button
            variant="soft"
            disabled={busy}
            onClick={() => dashboard.mutate()}
            className="gap-2 text-sm"
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            {provider === "global" ? "تحديث الحساب البنكي" : "لوحة Stripe (البنك والتحويلات)"}
          </Button>
        ) : status !== "unsupported" || needsCountry ? (
          <Button
            variant="primary"
            disabled={busy || (needsCountry && !selectedCountry)}
            onClick={() => connect.mutate()}
            className="gap-2 text-sm"
          >
            {connect.isPending
              ? "جارٍ فتح Stripe…"
              : needsCountry
                ? "اربط حسابك البنكي"
                : "أكمل بياناتك على Stripe"}
          </Button>
        ) : null}
        {status === "onboarding" || status === "restricted" ? (
          <Button
            variant="soft"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
            className="text-sm"
          >
            {refresh.isPending ? "جارٍ التحقق…" : "تحقّق من الحالة"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** Balance, the Stripe payout account and payout history. Payouts are automatic: nothing to request. */
export function MarketerPayoutsPage() {
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const [offset, setOffset] = useState(0);
  const balance = useQuery(marketerQueries.balance());
  const payouts = useQuery(marketerQueries.payouts({ offset }));
  const refreshed = useRef(false);

  // Back from Stripe onboarding: read the account's new state once.
  useEffect(() => {
    if (refreshed.current || !params.get("connect")) return;
    refreshed.current = true;
    void refreshMarketerConnect()
      .then((data) => queryClient.setQueryData(marketerKeys.balance(), data))
      .catch(() => undefined);
  }, [params, queryClient]);

  if (balance.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">جارٍ التحميل…</span>
        <Skeleton className="h-28" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (balance.isError) return <LoadError />;
  const b = balance.data;
  const short = Math.max(0, b.minimum_payout_minor - b.available_minor);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="جاهز للتحويل"
          value={<Money amount={fromMinor(b.available_minor)} />}
          note={
            b.will_be_paid ? (
              `يُحوَّل في ${formatDate(b.next_payout_date)}`
            ) : short > 0 ? (
              <>
                باقٍ <Money amount={fromMinor(short)} /> للحد الأدنى
              </>
            ) : undefined
          }
          icon={Wallet}
          tone="green"
        />
        <StatTile
          label="في فترة الاسترداد"
          value={<Money amount={fromMinor(b.pending_minor)} />}
          note={`تُعتمد بعد ${b.hold_days} يومًا من الشراء`}
          icon={Hourglass}
        />
        <StatTile
          label="حُوّل لك حتى الآن"
          value={<Money amount={fromMinor(b.paid_minor)} />}
          icon={CheckCircle2}
        />
        <StatTile
          label="التحويل القادم"
          value={formatDate(b.next_payout_date)}
          note={
            <>
              الحد الأدنى <Money amount={fromMinor(b.minimum_payout_minor)} />
            </>
          }
          icon={CalendarClock}
        />
      </div>

      <PayoutAccountCard balance={b} />

      <div className="ma-alert ma-alert--info m-0 text-sm" role="note">
        <p className="ma-alert__text m-0">
          لا تحتاج إلى طلب صرف: نحوّل أرباح جميع المسوّقين معًا في أول كل شهر،
          لكل من بلغ رصيده الحد الأدنى وحسابه جاهز. التحويل البنكي الدولي يصل
          عادة خلال 1–7 أيام عمل، ويحوّله بنكك إلى عملتك المحلية. الطلب الذي يُسترد
          خلال فترة الاسترداد تُلغى عمولته، وما يُسترد بعد التحويل يُخصم من
          التحويل التالي.
          {b.reversed_minor > 0 ? (
            <>
              {" "}
              خُصم حتى الآن بسبب الاستردادات:{" "}
              <Money amount={fromMinor(b.reversed_minor)} />.
            </>
          ) : null}
        </p>
      </div>

      <section
        aria-labelledby="payout-history-title"
        className="flex flex-col gap-3"
      >
        <h2 id="payout-history-title" className="m-0 text-lg font-bold">
          سجل التحويلات
        </h2>
        {payouts.isPending ? (
          <Skeleton className="h-40" />
        ) : payouts.isError ? (
          <LoadError />
        ) : payouts.data.items.length === 0 ? (
          <p className="m-0 flex items-center gap-2 rounded-panel border border-line bg-surface p-6 text-sm text-fg-muted">
            <Clock aria-hidden="true" className="size-4" /> لا تحويلات بعد. يظهر
            هنا كل تحويل فور إرساله.
          </p>
        ) : (
          <div
            className={cn(
              "overflow-x-auto rounded-panel border border-line bg-surface",
              payouts.isPlaceholderData && "opacity-70",
            )}
          >
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-alt/50 text-xs font-semibold text-fg-muted">
                  <th scope="col" className="p-3 text-start">
                    التاريخ
                  </th>
                  <th scope="col" className="p-3 text-start">
                    المرجع
                  </th>
                  <th scope="col" className="p-3 text-end">
                    المبلغ
                  </th>
                  <th scope="col" className="p-3 text-end">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payouts.data.items.map((payout) => (
                  <tr key={payout.payout_id}>
                    <td className="p-3">
                      {formatDate(payout.paid_at ?? payout.created_at ?? "")}
                    </td>
                    <td className="p-3">
                      <bdi dir="ltr" className="font-mono text-xs">
                        {payout.provider_ref ?? payout.stripe_transfer_id ?? "—"}
                      </bdi>
                    </td>
                    <td className="p-3 text-end font-semibold">
                      <Money amount={fromMinor(payout.amount_minor)} />
                      {creditedAmount(payout) ? (
                        <span className="block text-xs font-normal text-fg-muted">
                          ≈ <bdi dir="ltr">{creditedAmount(payout)}</bdi> في بنكك
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3 text-end">
                      <StatusTag map={PAYOUT_STATUS} status={payout.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {payouts.data ? (
          <Pager
            offset={offset}
            limit={MARKETER_PAGE_SIZE}
            total={payouts.data.total}
            onChange={setOffset}
          />
        ) : null}
      </section>

      <ButtonLink
        href={routes.marketerCommissions}
        variant="soft"
        className="self-start text-sm"
      >
        تفاصيل كل عمولة
      </ButtonLink>
    </div>
  );
}
