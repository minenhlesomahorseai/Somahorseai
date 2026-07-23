import "server-only";

import { cookies, headers } from "next/headers";

import {
  BASE_CURRENCY,
  currencyForCountry,
  normalizeCountryCode,
  normalizeCurrencyCode,
} from "./config";

export const CURRENCY_COOKIE = "somahorse_currency";

export interface CurrencyContext {
  countryCode: string | null;
  currency: string;
  source: "cookie" | "region" | "default";
}

function requestCountry(requestHeaders: Headers): string | null {
  return normalizeCountryCode(
    requestHeaders.get("x-vercel-ip-country") ??
      requestHeaders.get("cf-ipcountry") ??
      requestHeaders.get("x-country-code")
  );
}

/**
 * Resolves a public visitor without collecting or storing an IP address.
 * Hosting-provider country headers are used when available; localhost safely
 * falls back to the platform's canonical ZAR currency.
 */
export async function getVisitorCurrencyContext(): Promise<CurrencyContext> {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const countryCode = requestCountry(requestHeaders);
  const cookieValue = cookieStore.get(CURRENCY_COOKIE)?.value;
  const cookieCurrency = cookieValue
    ? normalizeCurrencyCode(cookieValue, "")
    : "";

  if (cookieCurrency) {
    return { countryCode, currency: cookieCurrency, source: "cookie" };
  }
  if (countryCode) {
    return {
      countryCode,
      currency: currencyForCountry(countryCode),
      source: "region",
    };
  }
  return { countryCode: null, currency: BASE_CURRENCY, source: "default" };
}

