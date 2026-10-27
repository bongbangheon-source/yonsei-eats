import Link from "next/link";
import { getAuthContext } from "@/lib/auth/session";
import { LogoutForm } from "./auth-forms";
import { LoginLink } from "./login-link";
import { ViewLink } from "./view-link";

export async function SiteHeader() {
  const { user, unavailable } = await getAuthContext();
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
          <ViewLink target="/" />
          <ViewLink target="/map" />
          {user ? <><Link href="/mypage" className="rounded-lg py-2 font-semibold text-navy">마이페이지</Link><LogoutForm /></> : <LoginLink />}
          {unavailable && <span role="status" className="text-xs text-slate-500">인증 상태 확인 불가</span>}
        </nav>
      </div>
    </header>
  );
}
