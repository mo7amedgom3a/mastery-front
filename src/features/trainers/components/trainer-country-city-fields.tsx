"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { describedBy, Field } from "@/features/auth/components/field";
import { CountrySearchSelect } from "@/components/ui/country-search-select";
import { locationQueries } from "@/features/business-request/api/locations";

const TYPE_CITY = "__type__";

export function TrainerCountryCityFields({
  baseId,
  defaultCountry = "",
  defaultCity = "",
  countryError,
  cityError,
  onCountryChange,
}: {
  baseId: string;
  defaultCountry?: string;
  defaultCity?: string;
  countryError?: string;
  cityError?: string;
  onCountryChange?: (countryName: string, countryCode: string) => void;
}) {
  const countryId = `${baseId}-country`;
  const cityId = `${baseId}-city`;

  const countries = useQuery(locationQueries.countries());

  const [selectedCountryName, setSelectedCountryName] = useState(defaultCountry);
  const [cityValue, setCityValue] = useState(defaultCity);
  const [typingCity, setTypingCity] = useState(false);

  // Derive country code from country name without useEffect
  const selectedCountryCode = useMemo(() => {
    if (!countries.data || !selectedCountryName) return "";
    const match = countries.data.find(
      (c) =>
        c.name === selectedCountryName ||
        c.nameEn.toLowerCase() === selectedCountryName.toLowerCase() ||
        c.code === selectedCountryName,
    );
    return match?.code ?? "";
  }, [countries.data, selectedCountryName]);

  const cities = useQuery({
    ...locationQueries.cities(selectedCountryCode),
    enabled: Boolean(selectedCountryCode),
  });

  const cityList = cities.data ?? [];
  const cityTyped =
    typingCity ||
    cities.isError ||
    (cities.isSuccess && (cityList.length === 0 || (cityValue !== "" && !cityList.includes(cityValue))));

  return (
    <>
      <CountrySearchSelect
        id={countryId}
        name="country"
        label="دولة الإقامة"
        value={selectedCountryName}
        valueKey="name"
        countries={countries.data ?? []}
        disabled={countries.isPending}
        error={countryError}
        onChange={(picked) => {
          setSelectedCountryName(picked.name);
          setTypingCity(false);
          setCityValue("");
          onCountryChange?.(picked.name, picked.code);
        }}
      />

      {cityTyped || !selectedCountryCode ? (
        <Field
          id={cityId}
          label="المدينة"
          error={cityError}
          hint={!selectedCountryCode ? "اختر دولة الإقامة أولاً" : undefined}
        >
          <input
            id={cityId}
            name="city"
            className="ma-input"
            autoComplete="address-level2"
            disabled={!selectedCountryCode}
            placeholder={!selectedCountryCode ? "اختر الدولة أولاً" : "اكتب اسم المدينة"}
            value={cityValue}
            {...describedBy(cityId, cityError)}
            onChange={(event) => setCityValue(event.target.value)}
          />
        </Field>
      ) : (
        <Field id={cityId} label="المدينة" error={cityError}>
          <select
            id={cityId}
            name="city"
            className="ma-select"
            dir="auto"
            value={cityValue}
            disabled={cities.isPending}
            {...describedBy(cityId, cityError)}
            onChange={(event) => {
              if (event.target.value === TYPE_CITY) {
                setTypingCity(true);
                setCityValue("");
              } else {
                setCityValue(event.target.value);
              }
            }}
          >
            <option value="" disabled>
              {cities.isPending ? "جارٍ تحميل المدن…" : "اختر المدينة"}
            </option>
            {cityList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={TYPE_CITY}>مدينة غير موجودة؟ اكتبها</option>
          </select>
        </Field>
      )}
    </>
  );
}
