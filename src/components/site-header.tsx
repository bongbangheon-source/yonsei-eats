import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue" aria-label="연세잇츠 홈">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-white">잇</span>
          <span className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-navy">연세잇츠</span>
            <span lang="en" className="text-xs tracking-wider text-slate-500">YONSEI EATS</span>
          </span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-3 text-sm sm:gap-6">
          <Link href="/#restaurants" className="rounded-lg py-2 font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue">식당 탐색</Link>
          <button type="button" disabled data-preparing className="cursor-not-allowed py-2 text-slate-500">지도 보기 <span className="text-xs">· 준비 중</span></button>
          <button type="button" disabled data-preparing className="cursor-not-allowed rounded-xl border border-slate-200 px-3 py-2 text-slate-500">로그인 <span className="text-xs">· 준비 중</span></button>
        </nav>
      </div>
    </header>
  );
}
