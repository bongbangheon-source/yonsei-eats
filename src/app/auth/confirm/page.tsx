import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ConfirmForm } from "@/components/auth-forms";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "이메일 인증 | 연세잇츠", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Confirm({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string; next?: string }> }) {
  const params = await searchParams;
  const valid = typeof params.token_hash === "string" && /^[a-fA-F0-9]{32,256}$/.test(params.token_hash) && params.type === "email";
  return <AuthShell title="이메일 인증" description="이메일을 확인하고 연세잇츠 가입을 완료하세요.">{valid ? <ConfirmForm token={params.token_hash!} next={safeNext(params.next)} /> : <div className="space-y-4"><p role="alert" className="text-sm leading-7">인증 링크가 올바르지 않습니다. 받은 메일의 링크를 확인하거나 다시 가입 요청해 주세요.</p><Link href="/signup" className="text-link-blue underline">회원가입으로 이동</Link></div>}</AuthShell>;
}
