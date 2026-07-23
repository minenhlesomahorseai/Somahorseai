import "server-only";

import {
  Environment,
  Paddle,
  type CurrencyCode,
  type EventEntity,
  type TaxCategory,
  type Transaction,
} from "@paddle/paddle-node-sdk";

import {
  BASE_CURRENCY,
  checkoutCurrencyFor,
  majorToMinor,
  minorToMajor,
  normalizeCountryCode,
  normalizeCurrencyCode,
  type PaddlePaymentCurrency,
} from "@/lib/currency/config";

let paddleClient: Paddle | null = null;

const paddleTaxCategories = new Set<TaxCategory>([
  "digital-goods",
  "ebooks",
  "implementation-services",
  "professional-services",
  "saas",
  "software-programming-services",
  "standard",
  "training-services",
  "website-hosting",
]);

function paddleTaxCategory(): TaxCategory {
  const configured = process.env.PADDLE_TAX_CATEGORY as TaxCategory | undefined;
  return configured && paddleTaxCategories.has(configured) ? configured : "standard";
}

function paddleEnvironment(): Environment {
  return process.env.PADDLE_ENVIRONMENT === "production"
    ? Environment.production
    : Environment.sandbox;
}

export function publicPaddleEnvironment(): "production" | "sandbox" {
  return paddleEnvironment() === Environment.production ? "production" : "sandbox";
}

export function paddleApiConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY);
}

export function paddleCheckoutConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY && process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN);
}

export function paddleWebhookConfigured(): boolean {
  return Boolean(process.env.PADDLE_WEBHOOK_SECRET_KEY);
}

export function paddleClientToken(): string | null {
  return process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? null;
}

export function getPaddle(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not configured");
  if (!paddleClient) {
    paddleClient = new Paddle(apiKey, { environment: paddleEnvironment() });
  }
  return paddleClient;
}

export interface PaddleCheckoutQuote {
  baseAmount: number;
  baseCurrency: typeof BASE_CURRENCY;
  presentmentAmountMinor: number;
  presentmentCurrency: PaddlePaymentCurrency;
  requestedCurrency: string;
  countryCode: string | null;
  fxRate: number;
  fxSource: "identity" | "paddle_preview";
  quotedAt: string;
}

export interface LocalizedPaddleTransaction {
  transaction: Transaction;
  quote: PaddleCheckoutQuote;
}

async function quotePaddleCheckout({
  amountZar,
  preferredCurrency,
  countryCode,
}: {
  amountZar: number;
  preferredCurrency?: string | null;
  countryCode?: string | null;
}): Promise<PaddleCheckoutQuote> {
  const baseAmount = Number(amountZar);
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
    throw new Error("Checkout amount must be greater than zero");
  }

  const requestedCurrency = normalizeCurrencyCode(preferredCurrency);
  const presentmentCurrency = checkoutCurrencyFor(requestedCurrency);
  const normalizedCountry = normalizeCountryCode(countryCode);
  const quotedAt = new Date().toISOString();

  if (presentmentCurrency === BASE_CURRENCY) {
    return {
      baseAmount,
      baseCurrency: BASE_CURRENCY,
      presentmentAmountMinor: majorToMinor(baseAmount, BASE_CURRENCY),
      presentmentCurrency,
      requestedCurrency,
      countryCode: normalizedCountry,
      fxRate: 1,
      fxSource: "identity",
      quotedAt,
    };
  }

  const preview = await getPaddle().transactions.preview({
    currencyCode: presentmentCurrency as CurrencyCode,
    ...(normalizedCountry
      ? { address: { countryCode: normalizedCountry as never } }
      : {}),
    items: [
      {
        quantity: 1,
        price: {
          name: "Somahorse.ai project currency quote",
          description: "Localized preview of a project amount",
          unitPrice: {
            amount: String(majorToMinor(baseAmount, BASE_CURRENCY)),
            currencyCode: BASE_CURRENCY,
          },
          // An external-tax preview gives us the converted list price without
          // folding estimated tax into the immutable checkout FX snapshot.
          taxMode: "external",
          product: {
            name: "Somahorse.ai project",
            description: "Localized project payment preview.",
            taxCategory: paddleTaxCategory(),
          },
        },
      },
    ],
  });
  const amountMinor = Number(
    preview.details.lineItems[0]?.unitTotals.subtotal
  );
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new Error("Paddle did not return a valid localized checkout amount");
  }

  return {
    baseAmount,
    baseCurrency: BASE_CURRENCY,
    presentmentAmountMinor: amountMinor,
    presentmentCurrency,
    requestedCurrency,
    countryCode: normalizedCountry,
    fxRate:
      minorToMajor(amountMinor, presentmentCurrency) / baseAmount,
    fxSource: "paddle_preview",
    quotedAt,
  };
}

export async function createDepositTransaction({
  projectId,
  conversationId,
  clientId,
  title,
  depositZar,
  preferredCurrency,
  countryCode,
}: {
  projectId: string;
  conversationId: string;
  clientId: string;
  title: string;
  depositZar: number;
  preferredCurrency?: string | null;
  countryCode?: string | null;
}): Promise<LocalizedPaddleTransaction> {
  const quote = await quotePaddleCheckout({
    amountZar: depositZar,
    preferredCurrency,
    countryCode,
  });
  const transaction = await getPaddle().transactions.create({
    currencyCode: quote.presentmentCurrency,
    customData: {
      project_id: projectId,
      conversation_id: conversationId,
      client_id: clientId,
      payment_kind: "deposit",
      base_amount: quote.baseAmount,
      base_currency: quote.baseCurrency,
      presentment_amount_minor: quote.presentmentAmountMinor,
      presentment_currency: quote.presentmentCurrency,
      requested_currency: quote.requestedCurrency,
      fx_rate: quote.fxRate,
      fx_source: quote.fxSource,
      fx_quoted_at: quote.quotedAt,
    },
    items: [
      {
        quantity: 1,
        price: {
          name: "Project start deposit",
          description: `Somahorse.ai project deposit: ${title}`.slice(0, 500),
          unitPrice: {
            amount: String(quote.presentmentAmountMinor),
            currencyCode: quote.presentmentCurrency,
          },
          taxMode: "account_setting",
          product: {
            name: title.slice(0, 200),
            description: "Design, engineering, delivery, and launch of a Somahorse.ai agricultural solution.",
            taxCategory: paddleTaxCategory(),
          },
        },
      },
    ],
  });
  return { transaction, quote };
}

export async function createWorkspacePaymentTransaction({
  paymentId,
  projectId,
  clientId,
  title,
  description,
  amountZar,
  kind,
  milestoneId,
  periodKey,
  preferredCurrency,
  countryCode,
}: {
  paymentId: string;
  projectId: string;
  clientId: string;
  title: string;
  description: string;
  amountZar: number;
  kind: "build_stage" | "delivery" | "monthly";
  milestoneId?: string | null;
  periodKey?: string | null;
  preferredCurrency?: string | null;
  countryCode?: string | null;
}): Promise<LocalizedPaddleTransaction> {
  if (!Number.isFinite(amountZar) || amountZar <= 0) {
    throw new Error("Workspace payment amount must be greater than zero");
  }
  const itemName =
    kind === "monthly" ? "Monthly project support" : kind === "delivery" ? "Project delivery payment" : "Project milestone payment";
  const quote = await quotePaddleCheckout({
    amountZar,
    preferredCurrency,
    countryCode,
  });

  const transaction = await getPaddle().transactions.create({
    currencyCode: quote.presentmentCurrency,
    customData: {
      project_id: projectId,
      client_id: clientId,
      payment_id: paymentId,
      payment_kind: kind,
      ...(milestoneId ? { milestone_id: milestoneId } : {}),
      ...(periodKey ? { period_key: periodKey } : {}),
      base_amount: quote.baseAmount,
      base_currency: quote.baseCurrency,
      presentment_amount_minor: quote.presentmentAmountMinor,
      presentment_currency: quote.presentmentCurrency,
      requested_currency: quote.requestedCurrency,
      fx_rate: quote.fxRate,
      fx_source: quote.fxSource,
      fx_quoted_at: quote.quotedAt,
    },
    items: [
      {
        quantity: 1,
        price: {
          name: itemName,
          description: description.slice(0, 500),
          unitPrice: {
            amount: String(quote.presentmentAmountMinor),
            currencyCode: quote.presentmentCurrency,
          },
          taxMode: "account_setting",
          product: {
            name: title.slice(0, 200),
            description: "Verified Somahorse.ai project delivery and managed support services.",
            taxCategory: paddleTaxCategory(),
          },
        },
      },
    ],
  });
  return { transaction, quote };
}

export function getPaddleTransaction(transactionId: string): Promise<Transaction> {
  return getPaddle().transactions.get(transactionId);
}

export async function getPaddleInvoiceUrl(transactionId: string): Promise<string> {
  const invoice = await getPaddle().transactions.getInvoicePDF(transactionId);
  return invoice.url;
}

export function unmarshalPaddleWebhook(
  rawBody: string,
  signature: string
): Promise<EventEntity> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET_KEY;
  if (!secret) throw new Error("PADDLE_WEBHOOK_SECRET_KEY is not configured");
  return getPaddle().webhooks.unmarshal(rawBody, secret, signature);
}
