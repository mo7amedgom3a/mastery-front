"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useState } from "react";

import { describedBy, Field } from "@/features/auth/components/field";
import { locationQueries, type PhoneCode } from "@/features/business-request/api/locations";

const PRIORITY_CODES = ["SA", "AE", "EG", "KW", "QA", "BH", "OM", "JO"];

const DEFAULT_FALLBACK_CODES: PhoneCode[] = [
  { code: "SA", name: "السعودية", nameEn: "Saudi Arabia", callingCode: "+966", flag: "🇸🇦" },
  { code: "AE", name: "الإمارات", nameEn: "United Arab Emirates", callingCode: "+971", flag: "🇦🇪" },
  { code: "EG", name: "مصر", nameEn: "Egypt", callingCode: "+20", flag: "🇪🇬" },
  { code: "KW", name: "الكويت", nameEn: "Kuwait", callingCode: "+965", flag: "🇰🇼" },
  { code: "QA", name: "قطر", nameEn: "Qatar", callingCode: "+974", flag: "🇶🇦" },
  { code: "BH", name: "البحرين", nameEn: "Bahrain", callingCode: "+973", flag: "🇧🇭" },
  { code: "OM", name: "عمان", nameEn: "Oman", callingCode: "+968", flag: "🇴🇲" },
  { code: "JO", name: "الأردن", nameEn: "Jordan", callingCode: "+962", flag: "🇯🇴" },
];

const COUNTRY_SAMPLE_NUMBERS: Record<string, string> = {
  "+966": "5x xxx xxxx",
  "+20": "1x xxx xxxx",
  "+971": "5x xxx xxxx",
  "+965": "5x xxx xxxx",
  "+974": "3x xxx xxxx",
  "+973": "3x xxx xxxx",
  "+968": "9x xxx xxxx",
  "+962": "7x xxx xxxx",
  "+961": "7x xxx xxxx",
  "+964": "7x xxx xxxx",
  "+212": "6x xxx xxxx",
  "+213": "5x xxx xxxx",
  "+216": "2x xxx xxxx",
  "+249": "9x xxx xxxx",
  "+967": "7x xxx xxxx",
  "+218": "9x xxx xxxx",
  "+970": "5x xxx xxxx",
  "+963": "9x xxx xxxx",
  "+1": "202 555 0123",
  "+44": "7911 123456",
  "+33": "6 12 34 56 78",
  "+49": "151 23456789",
  "+90": "512 345 67 89",
};

export function getPhonePlaceholder(callingCode: string): string {
  const sample = COUNTRY_SAMPLE_NUMBERS[callingCode] ?? "x xxx xxxx";
  return `${callingCode} ${sample}`;
}

function splitPhoneNumber(raw: string, codes: PhoneCode[]): { code: string; local: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { code: "+966", local: "" };

  const sorted = [...codes].sort((a, b) => b.callingCode.length - a.callingCode.length);
  for (const item of sorted) {
    if (trimmed.startsWith(item.callingCode)) {
      return { code: item.callingCode, local: trimmed.slice(item.callingCode.length).trim() };
    }
  }
  return { code: "+966", local: trimmed.replace(/^\+/, "") };
}

export type PhoneInputFieldProps = {
  id?: string;
  name?: string;
  label: string;
  countryCode?: string;
  value?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  onChange?: (fullPhoneNumber: string) => void;
};

export function PhoneInputField({
  id: externalId,
  name,
  label,
  countryCode,
  value,
  defaultValue = "",
  error,
  hint,
  disabled = false,
  autoComplete = "tel",
  placeholder,
  onChange,
}: PhoneInputFieldProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const phoneCodesQuery = useQuery(locationQueries.phoneCodes());

  const allCodes = useMemo(() => {
    const list = phoneCodesQuery.data && phoneCodesQuery.data.length > 0 ? phoneCodesQuery.data : DEFAULT_FALLBACK_CODES;
    const seen = new Set<string>();
    return list.filter((item) => {
      if (!item.callingCode) return false;
      const key = `${item.code}-${item.callingCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [phoneCodesQuery.data]);

  const nearby = useMemo(
    () =>
      allCodes
        .filter((c) => PRIORITY_CODES.includes(c.code))
        .sort((a, b) => PRIORITY_CODES.indexOf(a.code) - PRIORITY_CODES.indexOf(b.code)),
    [allCodes],
  );

  const others = useMemo(
    () => allCodes.filter((c) => !PRIORITY_CODES.includes(c.code)),
    [allCodes],
  );

  const targetCallingCode = useMemo(() => {
    if (!countryCode) return null;
    const q = countryCode.trim().toLowerCase();
    const match = allCodes.find(
      (c) =>
        c.code.toLowerCase() === q ||
        c.name.toLowerCase() === q ||
        c.nameEn.toLowerCase() === q,
    );
    return match?.callingCode ?? null;
  }, [countryCode, allCodes]);

  const isControlled = value !== undefined;
  const parsedValue = isControlled ? splitPhoneNumber(value, allCodes) : null;

  const initialDefaultCode = targetCallingCode || splitPhoneNumber(defaultValue, allCodes).code;
  const [uncontrolledCode, setUncontrolledCode] = useState(initialDefaultCode);
  const [uncontrolledLocal, setUncontrolledLocal] = useState(() => splitPhoneNumber(defaultValue, allCodes).local);

  // Sync calling code when countryCode prop changes
  const [prevTargetCode, setPrevTargetCode] = useState(targetCallingCode);
  if (targetCallingCode && targetCallingCode !== prevTargetCode) {
    setPrevTargetCode(targetCallingCode);
    setUncontrolledCode(targetCallingCode);
  }

  // Active calling code
  const callingCode = targetCallingCode
    ? targetCallingCode
    : isControlled && parsedValue
      ? parsedValue.code
      : uncontrolledCode;

  const localNumber = isControlled && parsedValue ? parsedValue.local : uncontrolledLocal;

  // Sync controlled onChange when targetCallingCode changes externally
  useEffect(() => {
    if (targetCallingCode && isControlled) {
      const cleanedLocal = localNumber.trim().replace(/^0+/, "");
      const full = cleanedLocal ? `${targetCallingCode} ${cleanedLocal}` : "";
      onChange?.(full);
    }
  }, [targetCallingCode, isControlled, localNumber, onChange]);

  const updateNumber = (newCode: string, newLocal: string) => {
    if (!isControlled) {
      setUncontrolledCode(newCode);
      setUncontrolledLocal(newLocal);
    }
    const cleanedLocal = newLocal.trim().replace(/^0+/, "");
    const full = cleanedLocal ? `${newCode} ${cleanedLocal}` : "";
    onChange?.(full);
  };

  const fullPhone = localNumber.trim() ? `${callingCode} ${localNumber.trim().replace(/^0+/, "")}` : "";
  const dynamicPlaceholder = placeholder ?? getPhonePlaceholder(callingCode);

  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {name ? <input type="hidden" name={name} value={fullPhone} /> : null}
      <div className="flex gap-2" dir="ltr">
        <select
          aria-label="رمز الدولة"
          value={callingCode}
          disabled={disabled}
          className="ma-select w-36 sm:w-48 shrink-0 text-sm font-medium"
          onChange={(event) => updateNumber(event.target.value, localNumber)}
        >
          {nearby.length > 0 ? (
            <optgroup label="الأكثر اختياراً">
              {nearby.map((c) => (
                <option key={`${c.code}-${c.callingCode}`} value={c.callingCode}>
                  {c.flag} {c.callingCode} ({c.name})
                </option>
              ))}
            </optgroup>
          ) : null}
          <optgroup label="كل الدول">
            {others.map((c) => (
              <option key={`${c.code}-${c.callingCode}`} value={c.callingCode}>
                {c.flag} {c.callingCode} ({c.name})
              </option>
            ))}
          </optgroup>
        </select>
        <input
          id={id}
          type="tel"
          dir="ltr"
          inputMode="tel"
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={dynamicPlaceholder}
          value={localNumber}
          className="ma-input flex-1 text-start"
          {...describedBy(id, error, hint)}
          onChange={(event) => updateNumber(callingCode, event.target.value)}
        />
      </div>
    </Field>
  );
}
