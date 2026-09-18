import { type NextRequest, NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth-config";
import { explicitLocale, resolveLocale, languageTarget, LANGUAGE_PREFERENCE_COOKIE, REQUEST_LOCALE_HEADER } from "@/i18n/config";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = resolveLocale(pathname, request.cookies.get(LANGUAGE_PREFERENCE_COOKIE)?.value, request.headers.get("accept-language"));
  // Always replace caller-supplied presentation headers. These headers grant no access.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_LOCALE_HEADER, locale);
  request.headers.set(REQUEST_LOCALE_HEADER, locale);

  const target = languageTarget(pathname, locale);
  if ((request.method === "GET" || request.method === "HEAD") && !explicitLocale(pathname) && target !== pathname) {
    const url = request.nextUrl.clone(); url.pathname = target;
    const response = NextResponse.redirect(url);
    response.headers.set("Vary", "Accept-Language, Cookie");
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Content-Language", locale === "zh" ? "zh-CN" : "en");
    return response;
  }

  // Keep the original protected-dashboard session refresh. Public pages and
  // language detection must never introduce new authentication dependencies.
  const dashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const response = dashboard && getAuthProvider() !== "casdoor"
    ? await updateSession(request)
    : NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Language", locale === "zh" ? "zh-CN" : "en");
  // No automatic cookie writes: a link prefetch must never choose the language.
  return response;
}

export const config = {
  // Binaries, manifests, authentication APIs and static files stay outside this matcher.
  matcher: ["/", "/en", "/en/products/:path*", "/zh", "/zh/products/:path*", "/dashboard/:path*", "/admin/:path*", "/products/:path*", "/categories/:path*", "/sign-in", "/sign-up", "/forgot-password", "/support", "/about", "/privacy", "/terms"],
};
