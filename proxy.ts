import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth-config";
import { isLocale, localeFromAcceptLanguage, LOCALE_COOKIE } from "@/i18n/config";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (isLocale(firstSegment)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, firstSegment, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  if (pathname === "/") {
    const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(savedLocale)
      ? savedLocale
      : localeFromAcceptLanguage(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, locale, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  if (getAuthProvider() === "casdoor") return NextResponse.next();
  return await updateSession(request);
}

export const config = {
  // Release manifests and binaries must never depend on an identity provider.
  matcher: ["/", "/en", "/en/products/:path*", "/zh", "/zh/products/:path*", "/dashboard/:path*"],
};
