import type { Metadata } from "next";
import { Nunito, Orbitron } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "WORD IMPOSTER",
  description: "One word is lying. Can you find it?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${nunito.variable} ${orbitron.variable}`}>
      <body className="min-h-screen text-gray-100 font-sans antialiased">{children}</body>
    </html>
  );
}

