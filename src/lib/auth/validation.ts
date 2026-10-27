export type Credentials = { email: string; password: string; confirm?: string; nickname?: string };

export function safeNext(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048) return "/mypage";
  let decoded = value;
  try { for (let i = 0; i < 3; i++) decoded = decodeURIComponent(decoded); } catch { return "/mypage"; }
  const pathname = decoded.split(/[?#]/)[0];
  if (!decoded.startsWith("/") || pathname.includes("//") || /[\\\u0000-\u001f\u007f]/.test(decoded) || /[ %]/.test(pathname)) return "/mypage";
  const url = new URL(decoded, "https://internal.invalid");
  if (url.origin !== "https://internal.invalid" || /^\/(login|signup|auth)(\/|$)/.test(url.pathname)) return "/mypage";
  return value;
}

export function validateNickname(value: string): string | null {
  const length = Array.from(value.trim()).length;
  return length < 2 || length > 20 || /[\u0000-\u001f\u007f]/.test(value) ? "닉네임은 2~20자로 입력해 주세요." : null;
}

export function validateCredentials(input: Credentials, signup: boolean): string | null {
  if (input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "올바른 이메일 주소를 입력해 주세요.";
  if (!input.password || input.password.length > 256) return "비밀번호를 입력해 주세요(최대 256자).";
  if (signup && input.password.length < 8) return "비밀번호는 최소 8자 이상이어야 합니다.";
  if (signup && input.password !== input.confirm) return "비밀번호 확인이 일치하지 않습니다.";
  return signup ? validateNickname(input.nickname ?? "") : null;
}

export function authMessage(error?: { code?: string } | null): string {
  switch (error?.code) {
    case "invalid_credentials": return "이메일 또는 비밀번호를 확인해 주세요.";
    case "email_not_confirmed": return "이메일 인증을 완료한 뒤 로그인해 주세요.";
    case "user_already_exists": case "email_exists": return "이미 등록된 이메일일 수 있습니다. 로그인 또는 받은 인증 메일을 확인해 주세요.";
    case "over_email_send_rate_limit": case "over_request_rate_limit": return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
    case "weak_password": return "비밀번호가 보안 기준에 맞지 않습니다. 더 강한 비밀번호를 사용해 주세요.";
    case "signup_disabled": return "현재 회원가입을 사용할 수 없습니다. 운영자에게 문의해 주세요.";
    case "email_address_not_authorized": return "이메일 발송이 허용되지 않은 주소입니다. 운영자에게 인증 메일 발송 설정을 문의해 주세요.";
    case "email_provider_disabled": return "이메일 인증을 사용할 수 없습니다. 운영자에게 문의해 주세요.";
    case "email_address_invalid": return "인증 메일을 받을 수 있는 올바른 이메일 주소를 입력해 주세요.";
    default: return "인증 요청을 처리하지 못했습니다. 연결 상태를 확인하고 잠시 후 다시 시도해 주세요.";
  }
}
