import Link from "next/link";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main id="main-content" className="mx-auto w-full max-w-lg flex-1 px-5 py-12 sm:py-16">
    <p className="mb-3 text-xs font-semibold tracking-widest text-link-blue">YONSEI EATS · ACCOUNT</p>
    <h1 className="break-keep text-3xl font-bold tracking-tight text-navy">{title}</h1>
    <p className="mb-8 mt-4 break-keep text-sm leading-7 text-slate-600">{description}</p>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</section>
    <Link href="/" className="mt-7 block text-center text-sm text-link-blue underline underline-offset-4">로그인 없이 식당 탐색하기</Link>
  </main>;
}
