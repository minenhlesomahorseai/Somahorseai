import countryToCurrency from "country-to-currency";

export const BASE_CURRENCY = "ZAR";

export const PADDLE_PAYMENT_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CLP",
  "HKD",
  "SGD",
  "SEK",
  "ARS",
  "BRL",
  "CNY",
  "COP",
  "CZK",
  "DKK",
  "HUF",
  "ILS",
  "INR",
  "KRW",
  "MXN",
  "NOK",
  "NZD",
  "PEN",
  "PLN",
  "RUB",
  "THB",
  "TRY",
  "TWD",
  "UAH",
  "VND",
  "ZAR",
] as const;

export type PaddlePaymentCurrency = (typeof PADDLE_PAYMENT_CURRENCIES)[number];

const PADDLE_PAYMENT_CURRENCY_SET = new Set<string>(PADDLE_PAYMENT_CURRENCIES);
const COUNTRY_CURRENCIES = countryToCurrency as Readonly<Record<string, string>>;
const ISO_CURRENCY = /^[A-Z]{3}$/;
const ISO_COUNTRY = /^[A-Z]{2}$/;

export interface CurrencyOption {
  code: string;
  name: string;
  label: string;
  paddleSupported: boolean;
}

export function normalizeCurrencyCode(
  value: string | null | undefined,
  fallback = BASE_CURRENCY
): string {
  const code = value?.trim().toUpperCase() ?? "";
  return ISO_CURRENCY.test(code) ? code : fallback;
}

export function normalizeCountryCode(
  value: string | null | undefined
): string | null {
  const code = value?.trim().toUpperCase() ?? "";
  return ISO_COUNTRY.test(code) ? code : null;
}

export function currencyForCountry(
  countryCode: string | null | undefined
): string {
  const country = normalizeCountryCode(countryCode);
  return normalizeCurrencyCode(country ? COUNTRY_CURRENCIES[country] : null);
}

export function isPaddlePaymentCurrency(
  currency: string | null | undefined
): currency is PaddlePaymentCurrency {
  return PADDLE_PAYMENT_CURRENCY_SET.has(
    normalizeCurrencyCode(currency, "")
  );
}

/**
 * Paddle cannot present every ISO currency. Keep the user's true preference on
 * their profile, but use USD as the explicit checkout fallback when Paddle
 * does not support that currency.
 */
export function checkoutCurrencyFor(
  preferredCurrency: string | null | undefined
): PaddlePaymentCurrency {
  const normalized = normalizeCurrencyCode(preferredCurrency);
  return isPaddlePaymentCurrency(normalized) ? normalized : "USD";
}

export function currencyFractionDigits(currency: string): number {
  try {
    const digits = new Intl.NumberFormat("en", {
      style: "currency",
      currency: normalizeCurrencyCode(currency),
    }).resolvedOptions().maximumFractionDigits;
    return Math.max(0, Math.min(3, digits ?? 2));
  } catch {
    return 2;
  }
}

export function majorToMinor(amount: number, currency: string): number {
  const factor = 10 ** currencyFractionDigits(currency);
  return Math.round((Number(amount) || 0) * factor);
}

export function minorToMajor(amountMinor: number, currency: string): number {
  const factor = 10 ** currencyFractionDigits(currency);
  return (Number(amountMinor) || 0) / factor;
}

export function formatMoney(
  amount: number,
  currency = BASE_CURRENCY,
  options: Intl.NumberFormatOptions = {}
): string {
  const normalized = normalizeCurrencyCode(currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
      ...options,
    }).format(Number(amount) || 0);
  } catch {
    return `${normalized} ${(Number(amount) || 0).toLocaleString()}`;
  }
}

export function formatMinorMoney(
  amountMinor: number | null | undefined,
  currency: string | null | undefined
): string | null {
  if (amountMinor == null || !currency) return null;
  const normalized = normalizeCurrencyCode(currency);
  return formatMoney(minorToMajor(amountMinor, normalized), normalized);
}

export function formatCompactMoney(
  amount: number,
  currency = BASE_CURRENCY
): string {
  return formatMoney(amount, currency, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function currencyOptions(): CurrencyOption[] {
  const codes = [...new Set(Object.values(COUNTRY_CURRENCIES))]
    .map((code) => normalizeCurrencyCode(code, ""))
    .filter((code) => ISO_CURRENCY.test(code))
    .sort();
  const names =
    typeof Intl.DisplayNames === "function"
      ? new Intl.DisplayNames(["en"], { type: "currency" })
      : null;

  return codes.map((code) => {
    const name = names?.of(code) ?? code;
    return {
      code,
      name,
      label: `${code} — ${name}`,
      paddleSupported: isPaddlePaymentCurrency(code),
    };
  });
}
