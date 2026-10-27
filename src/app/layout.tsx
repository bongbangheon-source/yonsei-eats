import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "연세잇츠 | Yonsei Eats",
  description: "연세대학교 신촌캠퍼스 주변, 나에게 맞는 한 끼를 찾는 곳.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
