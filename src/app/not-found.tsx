import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-24 text-center">
      <p className="text-sm font-semibold text-link-blue">404</p>
      <h1 className="mt-4 text-3xl font-bold text-navy">식당을 찾을 수 없어요</h1>
      <p className="mt-4 leading-7 text-slate-600">주소를 확인하거나 전체 식당 목록에서 다시 찾아보세요.</p>
      <Link href="/" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-navy px-6 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue">식당 탐색으로 돌아가기</Link>
    </main>
  );
}
