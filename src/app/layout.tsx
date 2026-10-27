import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "연세잇츠 | Yonsei Eats",
  description: "연세대학교 신촌캠퍼스 주변, 나에게 맞는 한 끼를 찾는 곳.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-3 focus:text-white">본문 바로가기</a>
        <SiteHeader />
        {children}
        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-8 text-xs leading-6 text-slate-500 sm:px-8"><span className="font-semibold text-navy">연세잇츠 · Yonsei Eats</span><span>신촌에서 만나는 나에게 맞는 한 끼</span></div>
        </footer>
      </body>
    </html>
  );
}
