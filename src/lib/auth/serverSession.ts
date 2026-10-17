import { NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";

export interface VerifiedIdentity {
  /** Supabase Auth user id (auth.users.id). The only user identifier in Intimo. */
  sub: string;
  email?: string;
  emailVerified: boolean;
  mfaAuthenticated: boolean;
  /** Unix seconds of the last interactive sign-in. */
  authenticatedAt?: number;
}

export async function getVerifiedIdentity(req?: NextRequest): Promise<VerifiedIdentity | null> {
  void req;
  const supabase = createSessionClient();
  if (!supabase) return null;
  // getUser() revalidates the token with Supabase Auth; never trust getSession() alone on the server.
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) return null;
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const signedInAt = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN;
  return {
    sub: user.id,
    email: user.email ?? undefined,
    emailVerified: Boolean(user.email_confirmed_at),
    mfaAuthenticated: aal?.currentLevel === "aal2",
    authenticatedAt: Number.isNaN(signedInAt) ? undefined : Math.floor(signedInAt / 1000),
  };
}
