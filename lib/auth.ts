import "server-only";

import { createClient } from "@/utils/supabase/server";
import { getServerSession } from "next-auth";
import { getAuthProvider, normalizeIssuer, type AuthProvider } from "./auth-config";
import { createAuthOptions } from "./auth-options";

export type AppUser = {
  id: string;
  subject: string | null;
  issuer: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
  provider: AuthProvider;
};

type CasdoorSessionUser = {
  id?: string;
  subject?: string;
  issuer?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export const authProvider = getAuthProvider();
export const isCasdoorAuthEnabled = authProvider === "casdoor";

const casdoorIssuer = normalizeIssuer(process.env.CASDOOR_ISSUER);
export const authOptions = createAuthOptions();

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isCasdoorAuthEnabled) {
    const session = await getServerSession(authOptions);
    const user = session?.user as CasdoorSessionUser | undefined;
    const subject = user?.subject || user?.id;
    if (!user || !subject || user.issuer !== casdoorIssuer) return null;

    const issuer = user.issuer || casdoorIssuer;
    return {
      id: `${issuer}#${subject}`,
      subject,
      issuer,
      email: user.email ?? null,
      name: user.name ?? null,
      image: user.image ?? null,
      provider: "casdoor",
    };
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    id: user.id,
    subject: null,
    issuer: null,
    email: user.email ?? null,
    name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
    image: user.user_metadata?.avatar_url ?? null,
    provider: "supabase",
  };
}
