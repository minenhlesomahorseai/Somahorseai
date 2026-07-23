"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import {
  type CurrencyPreferenceState,
  updateCurrencyPreference,
} from "@/app/dashboard/currency-actions";
import type { CurrencyOption } from "@/lib/currency/config";

const initialState: CurrencyPreferenceState = {
  status: "idle",
  message: "",
};

export function CurrencyPreferenceForm({
  currentCurrency,
  options,
  description,
}: {
  currentCurrency: string;
  options: CurrencyOption[];
  description: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCurrencyPreference,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="preferredCurrency"
          className="text-xs font-bold text-navy"
        >
          Preferred currency
        </label>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          id="preferredCurrency"
          name="preferredCurrency"
          defaultValue={currentCurrency}
          className="h-11 min-w-64 rounded-2xl border border-border-strong bg-white px-4 text-sm font-semibold text-navy outline-none transition focus:border-blue-vivid focus:ring-2 focus:ring-blue-vivid/15"
        >
          {options.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-bold text-white shadow-glow transition hover:bg-navy-mid disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden />
          )}
          {pending ? "Saving..." : "Save currency"}
        </button>
      </div>

      {state.message ? (
        <p
          role="status"
          className={`text-xs font-semibold ${
            state.status === "error" ? "text-red-600" : "text-accent-teal"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
