import type { Metadata } from "next";
import { Tenor_Sans, Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";

const tenorSans = Tenor_Sans({
  weight: "400",
  variable: "--font-tenor-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
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
   <html lang="en" className={`${tenorSans.variable} ${playfairDisplay.variable} ${caveat.variable}`}>
      <body className={`${tenorSans.className} antialiased overflow-x-hidden`}>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}      