import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "Pay-Orbit",
  description: "Payments admin panel",
};

// app/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={bricolage.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[var(--bg)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}