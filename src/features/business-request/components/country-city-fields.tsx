"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { describedBy, Field } from "@/features/auth/components/field";

import { locationQueries } from "../api/locations";
import { useRequestStore } from "../model/request-store";
import { TextField } from "./text-field";

/** Listed first: where most of our companies are. */
const NEARBY = ["SA", "AE", "KW", "QA", "BH", "OM", "EG", "JO"];
/** The city `<select>` option that switches to typing the city. */
const TYPE_CITY = "__type__";

/**
 * Country `<select>` from the country list, then a city `<select>` for that country. When the city
 * lookup fails or knows no cities, the city is typed instead.
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
  const nearby = (countries.data ?? []).filter((country) => NEARBY.includes(country.code));
  nearby.sort((a, b) => NEARBY.indexOf(a.code) - NEARBY.indexOf(b.code));
  const others = (countries.data ?? []).filter((country) => !NEARBY.includes(country.code));

  const cityList = cities.data ?? [];
  // A saved city that isn't in the list (typed earlier) keeps the text box.
  const cityTyped = typingCity || cities.isError || (cities.isSuccess && (cityList.length === 0 || (city !== "" && !cityList.includes(city))));

  return (
    <>
      <Field
        id={countryId}
        label="الدولة"
        error={countryError}
        hint={countryHint}
      >
        <select
          id={countryId}
          name="country"
          className="ma-select"
          value={countryCode ?? ""}
          disabled={countries.isPending}
          {...describedBy(countryId, countryError, countryHint)}
          onChange={(event) => {
            const picked = countries.data?.find((country) => country.code === event.target.value);
            setTypingCity(false);
            update({ countryCode: picked?.code ?? null, countryName: picked?.name ?? "", city: "" });
          }}
        >
          <option value="" disabled>
            {countries.isPending ? "جارٍ تحميل الدول…" : "اختر الدولة"}
          </option>
          {nearby.length > 0 ? (
            <optgroup label="الأكثر اختياراً">
              {nearby.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          <optgroup label="كل الدول">
            {others.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>

      {cityTyped || !countryCode ? (
        <TextField
          name="city"
          label="المدينة"
          autoComplete="address-level2"
          disabled={!countryCode}
          hint={!countryCode ? "اختر الدولة أولاً" : cities.isError ? "تعذّر تحميل المدن، اكتب اسم المدينة." : undefined}
        />
      ) : (
        <Field id={cityId} label="المدينة" error={errors.city}>
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
