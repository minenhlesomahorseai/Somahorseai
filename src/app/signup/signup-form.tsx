"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, Check, Loader2, Cpu, ShieldCheck, Sprout } from "lucide-react";

import { getPostAuthRedirect, signupRoleToUserRole } from "@/lib/auth/redirect";
import { fetchProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";

export function SignupForm({ initialRole }: { initialRole?: string }) {
  const isDevContext = initialRole === "developer";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [error, setError] = useState("");

  const theme = isDevContext
    ? {
        field: "talent-field talent-grid",
        badge: "border-talent/25 bg-talent-tint text-talent",
        dot: "bg-talent",
        accentText: "text-talent",
        inputFocus: "focus:border-talent focus:ring-talent/10",
        checkbox: "text-talent focus:ring-talent/20 accent-talent",
        button: "bg-talent hover:bg-navy",
        successIcon: "bg-talent-tint text-talent",
      }
    : {
        field: "client-field client-grid",
        badge: "border-client/25 bg-client-tint text-client",
        dot: "bg-client-bright",
        accentText: "text-client",
        inputFocus: "focus:border-client-bright focus:ring-client-bright/10",
        checkbox: "text-client focus:ring-client/20 accent-client",
        button: "bg-client hover:bg-emerald-900",
        successIcon: "bg-client-tint text-client",
      };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all credentials.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service.");
      return;
    }
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const role = signupRoleToUserRole(initialRole);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setIsLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.user && !data.session) {
      setIsLoading(false);
      setNeedsEmailConfirmation(true);
      setIsSuccess(true);
      return;
    }

    if (data.user) {
      const profile = await fetchProfile(supabase, data.user.id);
      const destination = profile
        ? getPostAuthRedirect(profile.role, profile.onboarding_status)
        : role === "talent"
          ? "/onboarding/talent"
          : "/onboarding/client";

      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = destination;
      }, 1200);
      return;
    }

    setIsLoading(false);
    setError("Unable to create your account. Please try again.");
  };

  return (
    <div className={`relative min-h-screen overflow-hidden bg-background ${theme.field}`}>
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ── Left column: form ── */}
        <div className="relative z-10 flex flex-col">
          <header className="flex items-center justify-between px-6 py-6 sm:px-10">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold text-navy-mid shadow-soft backdrop-blur-md transition hover:bg-white hover:text-navy hover:shadow-card"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back
            </Link>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className={`size-1.5 rounded-full ${theme.dot} animate-glow-pulse`} />
              Secure Connection
            </span>
          </header>

          <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-10">
            <div className="w-full max-w-[440px]">
              {/* Logo, context tag, greeting */}
              <div className="mb-6 flex flex-col items-start text-left">
                <Link href="/" className="mb-5 inline-flex items-center gap-2">
                  <Image
                    src="/somahorse-logo.png"
                    alt="Somahorse.ai Logo"
                    width={38}
                    height={38}
                    className="size-9 rounded-full object-contain"
                    priority
                  />
                  <span className="font-display text-lg font-bold text-navy">
                    Somahorse<span className="text-blue-vivid">.ai</span>
                  </span>
                </Link>

                <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-soft animate-fade-up ${theme.badge}`}>
                  <span className={`size-2 rounded-full ${theme.dot} animate-glow-pulse`} />
                  {isDevContext ? "Joining as a Certified Developer" : "Joining as a Project Client"}
                </div>

                <h1 className="font-ui text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                  {isDevContext ? "Create developer profile" : "Create client account"}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  {isDevContext
                    ? "Get matched with funded projects and start building."
                    : "Describe agricultural requirements and watch our AI build them."
                  }
                </p>
              </div>

              {isSuccess ? (
                <div className="py-10 text-center animate-fade-up">
                  <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${theme.successIcon}`}>
                    <Check className="size-6 stroke-[3]" />
                  </div>
                  <h3 className="font-ui text-lg font-bold text-navy">
                    {needsEmailConfirmation ? "Confirm your email" : "Account created"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {needsEmailConfirmation
                      ? "We sent a confirmation link to your inbox. Open it to finish signing up."
                      : "Preparing your onboarding workspace..."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-xl bg-accent-amber/10 border border-accent-amber/20 p-3.5 text-xs font-medium text-accent-amber text-center">
                      {error}
                    </div>
                  )}

                  {/* Name input */}
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-xs font-bold text-navy-mid/80 tracking-wide uppercase font-ui">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60 pointer-events-none">
                        <User className="size-4.5" />
                      </span>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isDevContext ? "e.g. Sipho Ndlovu" : "e.g. Agri Logistics Lead"}
                        className={`w-full min-h-11 rounded-xl border border-border-strong bg-white/60 pl-10.5 pr-4 text-sm text-navy placeholder-muted-foreground/50 transition-all focus:bg-white focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                        required
                      />
                    </div>
                  </div>

                  {/* Email input */}
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-bold text-navy-mid/80 tracking-wide uppercase font-ui">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60 pointer-events-none">
                        <Mail className="size-4.5" />
                      </span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@supplychain.com"
                        className={`w-full min-h-11 rounded-xl border border-border-strong bg-white/60 pl-10.5 pr-4 text-sm text-navy placeholder-muted-foreground/50 transition-all focus:bg-white focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                        required
                      />
                    </div>
                  </div>

                  {/* Password input */}
                  <div className="space-y-1">
                    <label htmlFor="password" className="text-xs font-bold text-navy-mid/80 tracking-wide uppercase font-ui">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60 pointer-events-none">
                        <Lock className="size-4.5" />
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full min-h-11 rounded-xl border border-border-strong bg-white/60 pl-10.5 pr-11 text-sm text-navy placeholder-muted-foreground/50 transition-all focus:bg-white focus:outline-none focus:ring-2 ${theme.inputFocus}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground/75 hover:text-navy-mid transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms agreement checkbox */}
                  <div className="flex items-start py-1">
                    <input
                      id="agree-terms"
                      name="agree-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className={`mt-0.5 size-4.5 rounded-md border-border-strong cursor-pointer ${theme.checkbox}`}
                    />
                    <label htmlFor="agree-terms" className="ml-2.5 text-xs font-medium text-muted-foreground select-none cursor-pointer leading-normal">
                      I agree to the{" "}
                      <Link href="#" className={`font-semibold hover:underline ${theme.accentText}`}>Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="#" className={`font-semibold hover:underline ${theme.accentText}`}>Privacy Policy</Link>.
                    </label>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full min-h-11 flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-glow transition disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer font-ui ${theme.button}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create free account"
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <span className="relative bg-white/0 px-3 text-xs font-semibold text-muted-foreground/60 uppercase font-ui">
                      Or register with
                    </span>
                  </div>

                  {/* Dynamic OAuth buttons (GitHub hidden for Clients) */}
                  <div className={isDevContext ? "grid grid-cols-2 gap-3" : "grid grid-cols-1"}>
                    <button
                      type="button"
                      className="flex min-h-10.5 items-center justify-center gap-2 rounded-full border border-border-strong bg-white/70 text-xs font-bold text-navy shadow-soft hover:bg-white transition-all cursor-pointer font-ui"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    {isDevContext && (
                      <button
                        type="button"
                        className="flex min-h-10.5 items-center justify-center gap-2 rounded-full border border-border-strong bg-white/70 text-xs font-bold text-navy shadow-soft hover:bg-white transition-all cursor-pointer font-ui"
                      >
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                        </svg>
                        GitHub
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Role Helper Switch Link */}
              <div className="mt-5 border-t border-border/60 pt-4 text-left text-xs text-muted-foreground font-ui">
                {isDevContext ? (
                  <span>
                    Not a developer?{" "}
                    <Link href="/signup?role=client" className="font-bold text-client hover:underline">
                      Sign up as a client
                    </Link>
                  </span>
                ) : (
                  <span>
                    Are you an engineer?{" "}
                    <Link href="/signup?role=developer" className="font-bold text-talent hover:underline">
                      Join our developer network
                    </Link>
                  </span>
                )}
              </div>

              {/* Bottom login link */}
              <div className="mt-3 text-left text-sm text-muted-foreground font-ui">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className={`font-bold hover:underline transition-all ${theme.accentText}`}
                >
                  Log in
                </Link>
              </div>
            </div>
          </main>
        </div>

        {/* ── Right column: role signature panel (hidden on mobile) ── */}
        <aside
          aria-hidden
          className={`relative hidden lg:flex ${isDevContext ? "auth-panel-talent" : "auth-panel-client"}`}
        >
          {isDevContext ? (
            <>
              <div className="dev-dark-grid absolute inset-0 opacity-60" />
              <div className="pointer-events-none absolute -top-24 right-[-10%] size-[420px] rounded-full bg-talent-bright/10 blur-[130px]" />
              <div className="relative z-10 flex w-full flex-col justify-between p-12">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-talent font-ui">
                  <Cpu className="size-4" />
                  Developer Network
                </div>
                <div className="flex flex-1 items-end justify-center">
                  <Image
                    src="/developer-real-robot.png"
                    alt=""
                    width={480}
                    height={540}
                    className="dev-hero-robot-img max-w-[420px]"
                    priority
                  />
                </div>
                <blockquote className="mt-8">
                  <p className="max-w-md font-display text-2xl font-bold leading-snug text-navy">
                    Build the future of African agriculture — funded projects, AI safety nets, milestone payouts.
                  </p>
                  <footer className="mt-4 flex items-center gap-2 text-sm font-semibold text-talent">
                    <ShieldCheck className="size-4" />
                    Certified engineers only
                  </footer>
                </blockquote>
              </div>
            </>
          ) : (
            <>
              <Image
                src="/agriculture-banner.jpg"
                alt=""
                fill
                sizes="50vw"
                className="object-cover opacity-45"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-emerald-900/30" />
              <div className="relative z-10 flex w-full flex-col justify-between p-12">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-100/90 font-ui">
                  <Sprout className="size-4" />
                  For Agricultural Enterprises
                </div>
                <blockquote className="mt-auto">
                  <p className="max-w-md font-display text-3xl font-bold leading-snug text-white">
                    Describe the problem once. Watch it get scoped, priced, built, and kept alive.
                  </p>
                  <footer className="mt-5 text-sm font-semibold text-emerald-100/85">
                    From farm to shelf — provable, traceable, monitored.
                  </footer>
                </blockquote>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
