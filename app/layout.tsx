import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "무대 입퇴장 계수판",
  description: "일자/게이트별 실시간 입퇴장 계수를 위한 운영 도구",
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
