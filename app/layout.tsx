import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "영단어 암기 앱",
  description: "엑셀 파일로 영단어를 외우는 플래시카드 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

