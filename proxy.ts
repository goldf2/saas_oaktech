import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth-config";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  if (getAuthProvider() === "casdoor") return NextResponse.next();
  return await updateSession(request);
}

export const config = {
  // Release manifests and binaries must never depend on an identity provider.
  matcher: ["/dashboard/:path*"],
};
