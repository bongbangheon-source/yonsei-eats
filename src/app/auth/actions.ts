"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { authMessage, safeNext } from "@/lib/auth/validation";
import { signInAccount, signUpAccount, signOutAccount } from "@/lib/auth/operations";
import { ensureProfile, updateNickname } from "@/lib/auth/profile";

export type FormState = { status: "idle" | "error" | "success"; message: string };
const text = (form: FormData, name: string) => typeof form.get(name) === "string" ? form.get(name) as string : "";
const failure = (message = authMessage()): FormState => ({ status: "error", message });

async function sameOrigin() {
  // Next also checks CSRF. Require Origin explicitly, including non-JS form posts.
  const values = await headers();
  const origin = values.get("origin");
  const host = values.get("x-forwarded-host") ?? values.get("host");
  try { return !!origin && new URL(origin).host === host; } catch { return false; }
}

async function completeLogin(client: NonNullable<Awaited<ReturnType<typeof createAuthClient>>>, next: string) {
  let profile;
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return failure();
    profile = await ensureProfile(client, data.user);
  } catch { return failure(); }
  revalidatePath("/", "layout");
  redirect(profile.ok ? safeNext(next) : "/mypage?profile=retry");
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  if (!await sameOrigin()) return failure("요청 출처를 확인할 수 없습니다. 페이지를 새로고침해 주세요.");
  const client = await createAuthClient(true);
  if (!client) return failure("인증 서비스 설정을 확인해 주세요.");
  const result = await signInAccount(client.auth, { email: text(form, "email"), password: text(form, "password") });
  if (result.kind !== "signed-in") return failure(result.message);
  return completeLogin(client, text(form, "next"));
}

export async function signupAction(_: FormState, form: FormData): Promise<FormState> {
  if (!await sameOrigin()) return failure("요청 출처를 확인할 수 없습니다. 페이지를 새로고침해 주세요.");
  const client = await createAuthClient(true);
  if (!client) return failure("인증 서비스 설정을 확인해 주세요.");
  const result = await signUpAccount(client.auth, { email: text(form, "email"), password: text(form, "password"), confirm: text(form, "confirm"), nickname: text(form, "nickname") });
  if (result.kind === "confirmation") return { status: "success", message: result.message };
  if (result.kind !== "signed-in") return failure(result.message);
  return completeLogin(client, text(form, "next"));
}

export async function logoutAction(_: FormState, _form: FormData): Promise<FormState> {
  void _form;
  if (!await sameOrigin()) return failure("요청 출처를 확인할 수 없습니다. 페이지를 새로고침해 주세요.");
  const client = await createAuthClient(true);
  if (!client) return failure();
  const result = await signOutAccount(client.auth);
  if (result.kind !== "signed-out") return failure(result.message);
  revalidatePath("/", "layout");
  redirect("/login?loggedOut=1");
}

export async function profileAction(_: FormState, form: FormData): Promise<FormState> {
  if (!await sameOrigin()) return failure("요청 출처를 확인할 수 없습니다. 페이지를 새로고침해 주세요.");
  const client = await createAuthClient(true);
  if (!client) return failure();
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return failure("로그인이 만료되었거나 인증을 확인하지 못했습니다. 다시 로그인해 주세요.");
    const result = text(form, "operation") === "repair" ? await ensureProfile(client, data.user) : await updateNickname(client, data.user.id, text(form, "nickname"));
    if (!result.ok) return failure(result.message);
    revalidatePath("/", "layout");
    return { status: "success", message: "프로필을 저장했습니다." };
  } catch { return failure("프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
}

export async function confirmAction(_: FormState, form: FormData): Promise<FormState> {
  if (!await sameOrigin()) return failure("요청 출처를 확인할 수 없습니다. 페이지를 새로고침해 주세요.");
  const token = text(form, "token_hash");
  if (!/^[a-fA-F0-9]{32,256}$/.test(token)) return failure("인증 링크가 올바르지 않습니다. 받은 메일의 링크를 다시 확인해 주세요.");
  const client = await createAuthClient(true);
  if (!client) return failure();
  try {
    const { error } = await client.auth.verifyOtp({ token_hash: token, type: "email" });
    if (error) return failure("인증 링크가 만료되었거나 이미 사용되었습니다. 로그인하거나 회원가입에서 인증 메일을 다시 요청해 주세요.");
  } catch { return failure(); }
  return completeLogin(client, text(form, "next"));
}
