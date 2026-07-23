import "server-only";

import {
  BASE_CURRENCY,
  currencyFractionDigits,
  normalizeCurrencyCode,
} from "./config";

interface OpenExchangeRatesResponse {
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export interface FxQuote {
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: number;
  quoteAmount: number;
  rate: number;
  source: "identity" | "open_exchange_rates";
  quotedAt: string;
}

function roundCurrency(amount: number, currency: string): number {
  const factor = 10 ** currencyFractionDigits(currency);
  return Math.round(amount * factor) / factor;
}

async function openExchangeRates(): Promise<OpenExchangeRatesResponse | null> {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID?.trim();
  if (!appId) return null;

  const response = await fetch(
    "https://openexchangerates.org/api/latest.json?prettyprint=0",
    {
      headers: { Authorization: `Token ${appId}` },
      next: { revalidate: 3600 },
    }
  );
  if (!response.ok) {
    throw new Error(`FX provider returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Partial<OpenExchangeRatesResponse>;
  if (
    payload.base !== "USD" ||
    !payload.timestamp ||
    !payload.rates ||
    typeof payload.rates !== "object"
  ) {
    throw new Error("FX provider returned an invalid rate table");
  }
  return payload as OpenExchangeRatesResponse;
}

export async function quoteFx(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<FxQuote> {
  const baseCurrency = normalizeCurrencyCode(fromCurrency);
  const quoteCurrency = normalizeCurrencyCode(toCurrency);
  const baseAmount = Number(amount);
  if (!Number.isFinite(baseAmount) || baseAmount < 0) {
    throw new Error("FX amount must be a non-negative number");
  }

  if (baseCurrency === quoteCurrency) {
    return {
      baseCurrency,
      quoteCurrency,
      baseAmount,
      quoteAmount: roundCurrency(baseAmount, quoteCurrency),
      rate: 1,
      source: "identity",
      quotedAt: new Date().toISOString(),
    };
  }

  const table = await openExchangeRates();
  if (!table) {
    throw new Error(
      "Live currency conversion is not configured. Set OPEN_EXCHANGE_RATES_APP_ID."
    );
  }
  const fromUsdRate = table.rates[baseCurrency];
  const toUsdRate = table.rates[quoteCurrency];
  if (
    !Number.isFinite(fromUsdRate) ||
    fromUsdRate <= 0 ||
    !Number.isFinite(toUsdRate) ||
    toUsdRate <= 0
  ) {
    throw new Error(
      `No live exchange rate is available for ${baseCurrency}/${quoteCurrency}`
    );
  }

  const rate = toUsdRate / fromUsdRate;
  return {
    baseCurrency,
    quoteCurrency,
    baseAmount,
    quoteAmount: roundCurrency(baseAmount * rate, quoteCurrency),
    rate,
    source: "open_exchange_rates",
    quotedAt: new Date(table.timestamp * 1000).toISOString(),
  };
}

export async function tryQuoteFx(
  amount: number,
  fromCurrency = BASE_CURRENCY,
  toCurrency = BASE_CURRENCY
): Promise<FxQuote | null> {
  try {
    return await quoteFx(amount, fromCurrency, toCurrency);
  } catch (error) {
    console.warn(
      `[currency] Could not quote ${fromCurrency}/${toCurrency}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

