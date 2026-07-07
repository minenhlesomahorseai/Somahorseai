import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In — Somahorse.ai",
  description: "Log in to your Somahorse.ai dashboard to manage your agricultural infrastructure and build scoping projects.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
