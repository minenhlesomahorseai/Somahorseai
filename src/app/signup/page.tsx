import type { Metadata } from "next";
import { RoleSelect } from "./role-select";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create an Account — Somahorse.ai",
  description: "Join Somahorse.ai to scope your agricultural software projects, connect with certified developers, and build resilient infrastructure.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SignupPage(props: PageProps) {
  const params = await props.searchParams;
  const role = typeof params.role === "string" ? params.role : null;
  if (role !== "client" && role !== "developer") {
    return <RoleSelect />;
  }
  return <SignupForm initialRole={role} />;
}
