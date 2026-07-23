"use server";

import { revalidatePath } from "next/cache";

import {
  currencyOptions,
  normalizeCurrencyCode,
} from "@/lib/currency/config";
import { createClient } from "@/lib/supabase/server";

export interface CurrencyPreferenceState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function updateCurrencyPreference(
  _previousState: CurrencyPreferenceState,
  formData: FormData
): Promise<CurrencyPreferenceState> {
  const currency = normalizeCurrencyCode(
    formData.get("preferredCurrency")?.toString(),
    ""
  );
  const isSupportedPreference = currencyOptions().some(
    (option) => option.code === currency
  );

  if (!isSupportedPreference) {
    return {
      status: "error",
      message: "Choose a valid currency from the list.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session expired. Sign in and try again.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_currency: currency })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "We could not save the currency preference. Try again.",
    };
  }

  revalidatePath("/dashboard/client/settings");
  revalidatePath("/dashboard/talent/settings");
  revalidatePath("/dashboard/client/new-project");
  revalidatePath("/pricing");

  return {
    status: "success",
    message: `Currency preference saved as ${currency}.`,
  };
}
