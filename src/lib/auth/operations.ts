import type { SupabaseClient } from "@supabase/supabase-js";
import { authMessage, validateCredentials, type Credentials } from "./validation.ts";

export type AuthResult = { kind: "error" | "confirmation" | "signed-in" | "signed-out"; message: string };
const failure = (message: string): AuthResult => ({ kind: "error", message });

export async function signUpAccount(auth: Pick<SupabaseClient["auth"], "signUp">, input: Credentials): Promise<AuthResult> {
  const invalid = validateCredentials(input, true);
  if (invalid) return failure(invalid);
  try {
    const { data, error } = await auth.signUp({ email: input.email.trim(), password: input.password, options: { data: { display_name: input.nickname!.trim() } } });
    if (error) return failure(authMessage(error));
    if (data.session) return { kind: "signed-in", message: "회원가입이 완료되었습니다." };
    return { kind: "confirmation", message: "가입 요청을 접수했습니다. 새 계정인 경우 받은 인증 메일을 확인해 주세요. 이미 가입했다면 로그인해 주세요. 메일이 오지 않으면 스팸함을 확인하고 잠시 후 다시 시도해 주세요." };
  } catch { return failure(authMessage()); }
}

export async function signInAccount(auth: Pick<SupabaseClient["auth"], "signInWithPassword">, input: Credentials): Promise<AuthResult> {
  const invalid = validateCredentials(input, false);
  if (invalid) return failure(invalid);
  try {
    const { data, error } = await auth.signInWithPassword({ email: input.email.trim(), password: input.password });
    if (error || !data.session) return failure(authMessage(error));
    return { kind: "signed-in", message: "로그인되었습니다." };
  } catch { return failure(authMessage()); }
}

export async function signOutAccount(auth: Pick<SupabaseClient["auth"], "signOut">): Promise<AuthResult> {
  try {
    const { error } = await auth.signOut({ scope: "local" });
    return error ? failure(authMessage(error)) : { kind: "signed-out", message: "로그아웃되었습니다." };
  } catch { return failure(authMessage()); }
}
