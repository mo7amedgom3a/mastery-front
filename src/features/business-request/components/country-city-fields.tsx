"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { describedBy, Field } from "@/features/auth/components/field";
import { CountrySearchSelect } from "@/components/ui/country-search-select";

import { locationQueries } from "../api/locations";
import { useRequestStore } from "../model/request-store";
import { TextField } from "./text-field";

/** The city `<select>` option that switches to typing the city. */
const TYPE_CITY = "__type__";

/**
 * Country search select from the full country list, then a city `<select>` for that country.
 * When the city lookup fails or knows no cities, the city is typed instead.
 */
export function CountryCityFields() {
  const countryId = useId();
  const cityId = useId();
  const countryCode = useRequestStore((state) => state.countryCode);
  const city = useRequestStore((state) => state.city);
  const errors = useRequestStore((state) => state.errors);
  const update = useRequestStore((state) => state.update);
  const [typingCity, setTypingCity] = useState(false);

  const countries = useQuery(locationQueries.countries());
  const cities = useQuery({ ...locationQueries.cities(countryCode ?? ""), enabled: Boolean(countryCode) });

  const countryError = errors.countryCode ?? errors.countryName;
  const countryHint = countries.isError ? "تعذّر تحميل قائمة الدول. حدّث الصفحة وحاول مجدداً." : undefined;

  const cityList = cities.data ?? [];
  // A saved city that isn't in the list (typed earlier) keeps the text box.
  const cityTyped = typingCity || cities.isError || (cities.isSuccess && (cityList.length === 0 || (city !== "" && !cityList.includes(city))));

  return (
    <>
      <CountrySearchSelect
        id={countryId}
        label="الدولة"
        required
        value={countryCode ?? ""}
        valueKey="code"
        countries={countries.data ?? []}
        disabled={countries.isPending}
        error={countryError}
        hint={countryHint}
        onChange={(picked) => {
          setTypingCity(false);
          update({ countryCode: picked.code, countryName: picked.name, city: "" });
        }}
      />

      {cityTyped || !countryCode ? (
        <TextField
          name="city"
          label="المدينة"
          required
          autoComplete="address-level2"
          disabled={!countryCode}
          hint={!countryCode ? "اختر الدولة أولاً" : cities.isError ? "تعذّر تحميل المدن، اكتب اسم المدينة." : undefined}
        />
      ) : (
        <Field id={cityId} label="المدينة" error={errors.city} required>
          <select
            id={cityId}
            name="city"
            className="ma-select"
            dir="auto"
            value={city}
            disabled={cities.isPending}
            {...describedBy(cityId, errors.city)}
            onChange={(event) => {
              if (event.target.value === TYPE_CITY) {
                setTypingCity(true);
                update({ city: "" });
              } else update({ city: event.target.value });
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
