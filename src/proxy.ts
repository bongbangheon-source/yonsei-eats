import { createCookieAuthClient } from "./lib/supabase/auth-client";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseConfig } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const configuration = readSupabaseConfig(process.env);
  if (configuration.ok) {
    const client = createCookieAuthClient(configuration.config, {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          // Preserve all previous Set-Cookie headers if the SDK writes twice.
          const previous = response.cookies.getAll();
          response = NextResponse.next({ request });
          previous.forEach(cookie => response.cookies.set(cookie));
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
    }, process.env.NODE_ENV === "production");
    // No authorization is based on cookie contents; pages/actions call getUser too.
    try { await client.auth.getUser(); } catch { /* The page displays recoverable auth errors. */ }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", request.nextUrl.pathname === "/map" ? "strict-origin-when-cross-origin" : "no-referrer");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
