"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Check, Loader2 } from "lucide-react";

import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { fetchProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setIsLoading(false);
      setError(signInError.message);
      return;
    }

    if (!data.user) {
      setIsLoading(false);
      setError("Unable to sign in. Please try again.");
      return;
    }

    const profile = await fetchProfile(supabase, data.user.id);
    const fallback = searchParams.get("next") ?? "/onboarding/client";
    const destination = profile
      ? getPostAuthRedirect(profile.role, profile.onboarding_status)
      : fallback;

    setIsLoading(false);
    setIsSuccess(true);
    setTimeout(() => {
      window.location.href = destination;
    }, 1200);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-background hero-field dotted-grid">
      {/* Background radial highlights */}
      <div className="pointer-events-none absolute -top-40 left-1/4 size-[600px] rounded-full bg-blue-sky/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 size-[600px] rounded-full bg-navy-mid/10 blur-[140px]" />

      {/* Header / Back Link */}
      <header className="relative z-10 px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold text-navy-mid shadow-soft backdrop-blur-md transition hover:bg-white hover:text-navy hover:shadow-card"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          <span className="size-1.5 rounded-full bg-accent-teal animate-glow-pulse" />
          Secure connection
        </span>
      </header>

      {/* Card container */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[450px] transform transition-all duration-300">
          <div className="rounded-3xl border border-border/80 bg-white/80 p-8 shadow-elevated backdrop-blur-xl sm:p-10">
            
            {/* Logo and Greeting */}
            <div className="mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2 mb-4 justify-center">
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
              <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-navy">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your credentials to access your project dashboard.
              </p>
            </div>

            {isSuccess ? (
              <div className="py-8 text-center animate-fade-up">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
                  <Check className="size-6 stroke-[3]" />
                </div>
                <h3 className="font-ui text-lg font-bold text-navy">Authentication Successful</h3>
                <p className="mt-2 text-sm text-muted-foreground">Taking you to your workspace...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl bg-accent-amber/10 border border-accent-amber/20 p-3.5 text-xs font-medium text-accent-amber text-center">
                    {error}
                  </div>
                )}

                {/* Email input */}
                <div className="space-y-1.5">
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
                      className="w-full min-h-11 rounded-xl border border-border-strong bg-white/50 pl-10.5 pr-4 text-sm text-navy placeholder-muted-foreground/50 transition-all focus:border-blue-vivid focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-vivid/10"
                      required
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-bold text-navy-mid/80 tracking-wide uppercase font-ui">
                      Password
                    </label>
                    <Link
                      href="#"
                      className="text-xs font-semibold text-blue-vivid hover:text-navy transition-colors font-ui"
                    >
                      Forgot password?
                    </Link>
                  </div>
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
                      className="w-full min-h-11 rounded-xl border border-border-strong bg-white/50 pl-10.5 pr-11 text-sm text-navy placeholder-muted-foreground/50 transition-all focus:border-blue-vivid focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-vivid/10"
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

                {/* Remember me checkbox */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="size-4.5 rounded-md border-border-strong text-navy-mid focus:ring-navy-mid/20 accent-navy-mid"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 text-sm font-medium text-muted-foreground select-none cursor-pointer">
                    Remember this device
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-11 flex items-center justify-center gap-2 rounded-full bg-navy-mid text-sm font-semibold text-white shadow-glow transition hover:bg-navy disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer font-ui"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in to account"
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-white/0 px-3 text-xs font-semibold text-muted-foreground/60 uppercase font-ui">
                    Or continue with
                  </span>
                </div>

                {/* OAuth buttons */}
                <div className="grid grid-cols-2 gap-3">
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
                  <button
                    type="button"
                    className="flex min-h-10.5 items-center justify-center gap-2 rounded-full border border-border-strong bg-white/70 text-xs font-bold text-navy shadow-soft hover:bg-white transition-all cursor-pointer font-ui"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </button>
                </div>
              </form>
            )}

            {/* Bottom link */}
            <div className="mt-8 text-center text-sm text-muted-foreground font-ui">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-blue-vivid hover:text-navy hover:underline transition-all"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-border/40 bg-white/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-ui">
          <span>© {new Date().getFullYear()} Somahorse.ai · Durban & Cape Town</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-navy">Privacy Policy</Link>
            <Link href="#" className="hover:text-navy">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
