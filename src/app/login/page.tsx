import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { CredentialsForm } from "@/components/auth-forms";
import { getAuthContext } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "로그인 | 연세잇츠" };
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; loggedOut?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const { user, unavailable } = await getAuthContext();
  if (user) redirect(next);
  return <AuthShell title="다시 만나 반가워요" description="이메일로 로그인하고 나만의 프로필을 관리하세요.">
    {params.loggedOut === "1" && <p role="status" className="mb-5 text-sm text-navy">로그아웃되었습니다.</p>}
    {unavailable && <p role="alert" className="mb-5 text-sm text-red-800">인증 서비스 연결을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
    <CredentialsForm mode="login" next={next} />
  </AuthShell>;
}
