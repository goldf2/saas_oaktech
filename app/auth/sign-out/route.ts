import { getAuthProvider, getCasdoorLogoutUrl } from "@/lib/auth-config";
import { redirect } from "next/navigation";

export function GET() {
  if (getAuthProvider() !== "casdoor") redirect("/sign-in");
  redirect(getCasdoorLogoutUrl());
}
