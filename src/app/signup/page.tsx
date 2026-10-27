import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { CredentialsForm } from "@/components/auth-forms";
import { getAuthContext } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "회원가입 | 연세잇츠" };
export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const { user, unavailable } = await getAuthContext();
  if (user) redirect(next);
  return <AuthShell title="연세잇츠에 오신 걸 환영해요" description="이메일과 닉네임으로 시작하세요. 이메일 인증이 필요한 경우 받은 메일에서 가입을 완료할 수 있습니다.">
    {unavailable && <p role="alert" className="mb-5 text-sm text-red-800">인증 서비스 연결을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
    <CredentialsForm mode="signup" next={next} />
  </AuthShell>;
}
