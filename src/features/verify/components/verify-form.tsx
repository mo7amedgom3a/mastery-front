"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

/** Look a certificate up by the ID No printed on it (any case, dashes optional). */
export function VerifyForm({ initial = "" }: { initial?: string }) {
  const id = useId();
  const router = useRouter();
  const [code, setCode] = useState(initial);
  const cleaned = code.trim();

  return (
    <form
      role="search"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (cleaned) router.push(routes.verifyCertificate(cleaned.toUpperCase()));
      }}
    >
      <div className="ma-field min-w-[16rem] flex-1">
        <label htmlFor={id} className="ma-label">
          رقم الشهادة (ID No)
        </label>
        <input
          id={id}
          dir="ltr"
          className="ma-input font-mono uppercase"
          placeholder="MA-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          maxLength={40}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={!cleaned}>
        <Search aria-hidden="true" className="size-4" /> تحقّق
      </Button>
    </form>
  );
}
