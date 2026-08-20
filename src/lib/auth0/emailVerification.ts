import { managementRequest } from "./management";

export async function currentEmailVerification(identity: { sub: string; emailVerified: boolean }): Promise<boolean> {
  if (identity.emailVerified) return true;
  try {
    const response = await managementRequest(
      `/users/${encodeURIComponent(identity.sub)}?fields=user_id,email_verified&include_fields=true`,
    );
    if (!response.ok) return false;
    const payload: unknown = await response.json();
    return Boolean(payload && typeof payload === "object" && (payload as Record<string, unknown>).email_verified === true);
  } catch (error) {
    console.error("Current email verification could not be loaded", error);
    return false;
  }
}
