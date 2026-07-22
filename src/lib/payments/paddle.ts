import "server-only";

import {
  Environment,
  Paddle,
  type EventEntity,
  type TaxCategory,
  type Transaction,
} from "@paddle/paddle-node-sdk";

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

export async function createDepositTransaction({
  projectId,
  conversationId,
  clientId,
  title,
  depositZar,
}: {
  projectId: string;
  conversationId: string;
  clientId: string;
  title: string;
  depositZar: number;
}): Promise<Transaction> {
  return getPaddle().transactions.create({
    currencyCode: "ZAR",
    customData: {
      project_id: projectId,
      conversation_id: conversationId,
      client_id: clientId,
      payment_kind: "deposit",
    },
    items: [
      {
        quantity: 1,
        price: {
          name: "Project start deposit",
          description: `Somahorse.ai project deposit: ${title}`.slice(0, 500),
          unitPrice: {
            amount: String(Math.round(depositZar * 100)),
            currencyCode: "ZAR",
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
}): Promise<Transaction> {
  if (!Number.isFinite(amountZar) || amountZar <= 0) {
    throw new Error("Workspace payment amount must be greater than zero");
  }
  const itemName =
    kind === "monthly" ? "Monthly project support" : kind === "delivery" ? "Project delivery payment" : "Project milestone payment";

  return getPaddle().transactions.create({
    currencyCode: "ZAR",
    customData: {
      project_id: projectId,
      client_id: clientId,
      payment_id: paymentId,
      payment_kind: kind,
      ...(milestoneId ? { milestone_id: milestoneId } : {}),
      ...(periodKey ? { period_key: periodKey } : {}),
    },
    items: [
      {
        quantity: 1,
        price: {
          name: itemName,
          description: description.slice(0, 500),
          unitPrice: {
            amount: String(Math.round(amountZar * 100)),
            currencyCode: "ZAR",
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
