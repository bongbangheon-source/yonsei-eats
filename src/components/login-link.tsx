"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/auth/validation";

export function LoginLink() {
  const pathname = usePathname();
  const params = useSearchParams();
  const next = safeNext(`${pathname}${params.size ? `?${params}` : ""}`);
  return <Link href={`/login?next=${encodeURIComponent(next)}`} className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-navy">로그인</Link>;
}
