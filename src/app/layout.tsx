import type { Metadata } from "next";
import { Tenor_Sans } from "next/font/google";
import "./globals.css";

const tenorSans = Tenor_Sans({
  weight: "400",
  variable: "--font-tenor-sans",
  subsets: ["latin"],
  display: "swap",
});
 
export const metadata: Metadata = {
  title: "Somahorse.ai — AI infrastructure for African agriculture",
  description:
    "Describe your agricultural problem in plain language. Somahorse.ai scopes it, prices it, assembles a certified team, builds it, and keeps it running.",
};
 
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
   <html lang="en" className={tenorSans.variable}>
      <body className={tenorSans.className}>{children}</body>
    </html>
  );
}      