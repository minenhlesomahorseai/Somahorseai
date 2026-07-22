"use client";

import {
  CheckoutEventNames,
  initializePaddle,
  type Environments,
  type Paddle,
  type PaddleEventData,
} from "@paddle/paddle-js";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

let workspacePaddlePromise: Promise<Paddle | undefined> | null = null;
let workspaceEventCallback: ((event: PaddleEventData) => void) | null = null;

export function WorkspacePaddleCheckout({
  projectId,
  paymentId,
  transactionId,
  clientToken,
  environment,
  customerEmail,
}: {
  projectId: string;
  paymentId: string;
  transactionId: string;
  clientToken: string;
  environment: Environments;
  customerEmail: string | null;
}) {
  const router = useRouter();
  const checkoutOpened = useRef(false);
  const confirmingRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmPayment = useCallback(async () => {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    setConfirming(true);
    setError(null);
    for (let attempt = 0; attempt < 18; attempt += 1) {
      try {
        const response = await fetch("/api/paddle/workspace-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        const data = (await response.json()) as { paid?: boolean };
        if (response.ok && data.paid) {
          router.replace(`/dashboard/client/projects/${projectId}?payment=confirmed`);
          router.refresh();
          return;
        }
      } catch {
        // The verified webhook remains authoritative; poll briefly for UX.
      }
      await new Promise((resolve) => window.setTimeout(resolve, 2_000));
    }
    setError("Payment was received but is taking longer to confirm. You can safely return to the project workspace.");
    confirmingRef.current = false;
    setConfirming(false);
  }, [paymentId, projectId, router]);

  useEffect(() => {
    let cancelled = false;
    const eventHandler = (event: PaddleEventData) => {
      if (event.name === CheckoutEventNames.CHECKOUT_LOADED) setLoaded(true);
      if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) void confirmPayment();
      if (
        event.name === CheckoutEventNames.CHECKOUT_ERROR ||
        event.name === CheckoutEventNames.CHECKOUT_PAYMENT_ERROR ||
        event.name === CheckoutEventNames.CHECKOUT_PAYMENT_FAILED
      ) {
        setError(event.detail || "Paddle could not complete the payment. Please review the details and try again.");
      }
    };
    workspaceEventCallback = eventHandler;
    if (!workspacePaddlePromise) {
      workspacePaddlePromise = initializePaddle({
        token: clientToken,
        environment,
        eventCallback: (event) => workspaceEventCallback?.(event),
      });
    }
    void workspacePaddlePromise
      .then((paddle) => {
        if (cancelled || !paddle || checkoutOpened.current) return;
        checkoutOpened.current = true;
        paddle.Checkout.open({
          transactionId,
          ...(customerEmail ? { customer: { email: customerEmail } } : {}),
          settings: {
            displayMode: "inline",
            frameTarget: "workspace-paddle-checkout-frame",
            frameInitialHeight: 620,
            frameStyle: "width:100%; min-width:312px; background-color:transparent; border:none;",
            theme: "light",
            locale: "en",
            allowLogout: false,
            showAddTaxId: true,
          },
        });
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load secure checkout."));

    return () => {
      cancelled = true;
      if (workspaceEventCallback === eventHandler) workspaceEventCallback = null;
    };
  }, [clientToken, confirmPayment, customerEmail, environment, transactionId]);

  if (confirming) {
    return (
      <div className="flex min-h-[34rem] flex-col items-center justify-center px-6 text-center" aria-live="polite">
        <span className="grid size-16 place-items-center rounded-3xl bg-accent-teal/12 text-accent-teal">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold text-navy">Payment received</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">We&apos;re confirming the transaction, updating the project ledger, and allocating the team&apos;s 60% share.</p>
        <Loader2 className="mt-6 size-5 animate-spin text-navy-mid" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative min-h-[38rem] p-3 sm:p-5">
      {!loaded ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 text-center backdrop-blur-sm">
          <Loader2 className="size-6 animate-spin text-navy-mid" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">Opening secure checkout…</p>
        </div>
      ) : null}
      <div className="workspace-paddle-checkout-frame min-h-[38rem] w-full" />
      {error ? <div className="mt-3 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-3 text-sm text-accent-amber" role="alert">{error}</div> : null}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <LockKeyhole className="size-3" aria-hidden /> Payment details are handled securely by Paddle.
      </p>
    </div>
  );
}
