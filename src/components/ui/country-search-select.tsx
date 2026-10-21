"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { describedBy, Field } from "@/features/auth/components/field";
import type { Country } from "@/features/business-request/api/locations";

const NEARBY = ["SA", "AE", "KW", "QA", "BH", "OM", "EG", "JO"];

export type CountrySearchSelectProps = {
  id?: string;
  name?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  countries: Country[];
  disabled?: boolean;
  error?: string;
  hint?: string;
  valueKey?: "code" | "name";
  onChange: (country: Country) => void;
};

export function CountrySearchSelect({
  id: externalId,
  name,
  label = "الدولة",
  value,
  defaultValue = "",
  placeholder = "اختر الدولة",
  countries,
  disabled = false,
  error,
  hint,
  valueKey = "code",
  onChange,
}: CountrySearchSelectProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const activeValue = isControlled ? value : uncontrolledValue;

  const selectedCountry = useMemo(() => {
    if (!activeValue) return null;
    return (
      countries.find((c) => (valueKey === "code" ? c.code === activeValue : c.name === activeValue || c.code === activeValue)) ??
      null
    );
  }, [activeValue, countries, valueKey]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const query = search.trim().toLowerCase();

  const filteredCountries = useMemo(() => {
    if (!query) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.nameEn.toLowerCase().includes(query) ||
        c.code.toLowerCase() === query,
    );
  }, [countries, query]);

  const nearby = useMemo(() => {
    if (query) return [];
    return countries
      .filter((c) => NEARBY.includes(c.code))
      .sort((a, b) => NEARBY.indexOf(a.code) - NEARBY.indexOf(b.code));
  }, [countries, query]);

  const others = useMemo(() => {
    if (query) return filteredCountries;
    return countries.filter((c) => !NEARBY.includes(c.code));
  }, [countries, filteredCountries, query]);

  const handleSelect = (country: Country) => {
    if (!isControlled) {
      setUncontrolledValue(valueKey === "code" ? country.code : country.name);
    }
    onChange(country);
    setIsOpen(false);
    setSearch("");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={selectedCountry ? (valueKey === "code" ? selectedCountry.code : selectedCountry.name) : ""}
        />
      ) : null}

      <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
        <button
          type="button"
          id={id}
          disabled={disabled || countries.length === 0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="ma-input flex w-full items-center justify-between text-start cursor-pointer select-none"
          {...describedBy(id, error, hint)}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className={selectedCountry ? "text-fg font-medium" : "text-fg-muted"}>
            {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : countries.length === 0 ? "جارٍ تحميل الدول…" : placeholder}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen ? (
          <div
            role="listbox"
            className="absolute z-50 left-0 right-0 mt-1 max-h-80 w-full overflow-hidden rounded-control border border-line-strong bg-surface shadow-2xl p-2 flex flex-col gap-2"
          >
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                placeholder="ابحث بالاسم أو الرمز..."
                className="ma-input h-10 w-full py-1.5 px-3 text-sm"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
              {query === "" && nearby.length > 0 ? (
                <>
                  <div className="px-2 py-1 text-xs font-bold text-fg-muted">الأكثر اختياراً</div>
                  {nearby.map((c) => {
                    const isSelected = selectedCountry?.code === c.code;
                    return (
                      <button
                        key={`nearby-${c.code}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded transition-colors text-start ${
                          isSelected ? "bg-surface-alt font-bold text-accent" : "hover:bg-surface-alt text-fg"
                        }`}
                        onClick={() => handleSelect(c)}
                      >
                        <span>
                          {c.flag} {c.name}
                        </span>
                        <span className="text-xs text-fg-muted font-normal">{c.nameEn}</span>
                      </button>
                    );
                  })}
                  <div className="my-1 border-t border-line" />
                  <div className="px-2 py-1 text-xs font-bold text-fg-muted">كل الدول</div>
                </>
              ) : null}

              {others.length > 0 ? (
                others.map((c) => {
                  const isSelected = selectedCountry?.code === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded transition-colors text-start ${
                        isSelected ? "bg-surface-alt font-bold text-accent" : "hover:bg-surface-alt text-fg"
                      }`}
                      onClick={() => handleSelect(c)}
                    >
                      <span>
                        {c.flag} {c.name}
                      </span>
                      <span className="text-xs text-fg-muted font-normal">{c.nameEn}</span>
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-sm text-fg-muted">لا توجد نتائج مطابقة</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Field>
  );
}
