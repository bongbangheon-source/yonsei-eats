"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, signupAction, logoutAction, profileAction, confirmAction, type FormState } from "@/app/auth/actions";

const initial: FormState = { status: "idle", message: "" };
const inputStyle = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";
const buttonStyle = "w-full rounded-xl bg-navy px-5 py-3 font-semibold text-white hover:bg-navy/90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue";

function Notice({ state }: { state: FormState }) {
  return state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`rounded-xl p-4 text-sm leading-7 ${state.status === "error" ? "bg-red-50 text-red-800" : "bg-surface text-navy"}`}>{state.message}</p> : null;
}

export function CredentialsForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const signup = mode === "signup";
  const [state, action, pending] = useActionState(signup ? signupAction : loginAction, initial);
  const done = signup && state.status === "success";
  return <form action={action} className="space-y-5" data-auth-form={mode}>
    <input type="hidden" name="next" value={next} />
    <label className="block text-sm font-semibold">이메일<input className={inputStyle} type="email" name="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" disabled={pending || done} /></label>
    <label className="block text-sm font-semibold">비밀번호<input className={inputStyle} type="password" name="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : undefined} maxLength={256} aria-describedby={signup ? "password-help" : undefined} disabled={pending || done} /></label>
    {signup && <>
      <p id="password-help" className="text-xs leading-6 text-slate-600">비밀번호는 최소 8자 이상으로 입력해 주세요.</p>
      <label className="block text-sm font-semibold">비밀번호 확인<input className={inputStyle} type="password" name="confirm" autoComplete="new-password" required minLength={8} maxLength={256} disabled={pending || done} /></label>
      <label className="block text-sm font-semibold">닉네임<input className={inputStyle} name="nickname" autoComplete="nickname" required minLength={2} maxLength={20} disabled={pending || done} /><span className="mt-2 block text-xs font-normal text-slate-600">2~20자로 입력해 주세요.</span></label>
    </>}
    <Notice state={state} />
    {!done && <button className={buttonStyle} disabled={pending} type="submit">{pending ? "처리 중…" : signup ? "회원가입" : "로그인"}</button>}
    <p className="text-center text-sm leading-7 text-slate-600">{signup ? "이미 계정이 있나요? " : "처음 방문했나요? "}<Link className="font-semibold text-link-blue underline underline-offset-4" href={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}>{signup ? "로그인" : "회원가입"}</Link></p>
  </form>;
}

export function LogoutForm() {
  const [state, action, pending] = useActionState(logoutAction, initial);
  return <form action={action} className="space-y-3"><Notice state={state} /><button type="submit" disabled={pending} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-60">{pending ? "로그아웃 중…" : "로그아웃"}</button></form>;
}

export function ProfileForm({ nickname, missing }: { nickname: string | null; missing: boolean }) {
  const [state, action, pending] = useActionState(profileAction, initial);
  return <form action={action} className="space-y-4" data-profile-form>
    <input type="hidden" name="operation" value={missing ? "repair" : "update"} />
    {missing ? <p className="text-sm leading-7 text-slate-600">프로필을 생성하거나 조회하지 못했습니다. 로그인은 유지됩니다. 아래 버튼으로 복구를 재시도할 수 있습니다.</p> : <label className="block text-sm font-semibold">닉네임<input key={nickname ?? "empty"} className={inputStyle} name="nickname" autoComplete="nickname" defaultValue={nickname ?? ""} required minLength={2} maxLength={20} disabled={pending} /></label>}
    <Notice state={state} />
    <button type="submit" disabled={pending} className={buttonStyle}>{pending ? "저장 중…" : missing ? "프로필 다시 만들기" : "닉네임 저장"}</button>
  </form>;
}

export function ConfirmForm({ token, next }: { token: string; next: string }) {
  const [state, action, pending] = useActionState(confirmAction, initial);
  return <form action={action} className="space-y-5">
    <input type="hidden" name="token_hash" value={token} /><input type="hidden" name="next" value={next} />
    <p className="text-sm leading-7 text-slate-600">연세잇츠 회원가입을 요청했다면 아래 버튼을 눌러 이메일 인증을 완료해 주세요.</p>
    <Notice state={state} /><button type="submit" className={buttonStyle} disabled={pending}>{pending ? "확인 중…" : "이메일 인증 완료하기"}</button>
  </form>;
}
