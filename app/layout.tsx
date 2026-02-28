import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
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
    <html lang="ko" className={nunito.variable}>
      <body className="min-h-screen bg-bg-space text-gray-100 font-sans antialiased">{children}</body>
    </html>
  );
}

