// Private Album Handshake (P1-06): one grant per owner/viewer pair covering the
// owner's PRIVATE-visibility photos.

export const ONCE_GRANT_HOURS = 24;
export const DENIED_COOLDOWN_DAYS = 7;
export const DECISIONS = ["GRANT_ONCE", "GRANT", "DENY", "REVOKE"];

/** True while a grant row gives the viewer access right now. */
export function grantIsActive(row, now = new Date()) {
  if (!row || row.status !== "GRANTED") return false;
  if (row.grant_type === "UNTIL_REVOKED") return true;
  return row.grant_type === "ONCE" && Boolean(row.expires_at) && new Date(row.expires_at).getTime() > now.getTime();
}

/** Database update for an owner's decision, or null for an invalid one. */
export function decisionUpdate(decision, now = new Date()) {
  const decidedAt = now.toISOString();
  if (decision === "GRANT_ONCE") return { status: "GRANTED", grant_type: "ONCE", expires_at: new Date(now.getTime() + ONCE_GRANT_HOURS * 3_600_000).toISOString(), decided_at: decidedAt };
  if (decision === "GRANT") return { status: "GRANTED", grant_type: "UNTIL_REVOKED", expires_at: null, decided_at: decidedAt };
  if (decision === "DENY") return { status: "DENIED", grant_type: null, expires_at: null, decided_at: decidedAt };
  if (decision === "REVOKE") return { status: "REVOKED", grant_type: null, expires_at: null, decided_at: decidedAt };
  return null;
}

/**
 * Whether a viewer may (re)request access given the existing row.
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function canRequest(row, now = new Date()) {
  if (!row) return { ok: true };
  if (grantIsActive(row, now)) return { ok: false, reason: "You already have access." };
  if (row.status === "REQUESTED") return { ok: false, reason: "Your request is waiting for an answer." };
  if (row.status === "DENIED" && row.decided_at && now.getTime() - new Date(row.decided_at).getTime() < DENIED_COOLDOWN_DAYS * 86_400_000) {
    return { ok: false, reason: "This member declined recently. You can ask again in a few days." };
  }
  return { ok: true };
}
