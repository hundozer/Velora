import { ResendClient } from "./resendClient";

/** Where new-member alerts go. Override with REGISTRATION_ALERT_EMAIL; set it to "off" to stop them. */
export const REGISTRATION_ALERT_TO = process.env.REGISTRATION_ALERT_EMAIL || "registration@intimo.live";

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type NewMember = { profileId: string; displayName: string; profileType: string; areaName: string | null; createdAt: string };

/**
 * Tells the team someone joined. Deliberately minimal: no email address, birth date,
 * orientation, desires or photos — only what's needed to notice and look them up in Admin.
 * Never throws and never delays registration by more than a few seconds.
 */
export async function notifyNewRegistration(member: NewMember): Promise<boolean> {
  if (REGISTRATION_ALERT_TO === "off") return false;
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Prague" }).format(new Date(member.createdAt));
  const name = escape(member.displayName);
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#191C20">
<p style="margin:0 0 12px"><strong>New member on Intimo</strong></p>
<p style="margin:0">${name} · ${member.profileType === "COUPLE" ? "Couple" : "Individual"}${member.areaName ? ` · ${escape(member.areaName)}` : ""}</p>
<p style="margin:0 0 16px;color:#5b6570">${when} (Prague time)</p>
<p style="margin:0"><a href="https://intimo.live/admin" style="color:#1f6f9c">Open Admin</a> · profile ${escape(member.profileId)}</p>
</div>`;
  try {
    const sent = await Promise.race([
      ResendClient.sendEmail({ to: REGISTRATION_ALERT_TO, subject: `New member: ${member.displayName.slice(0, 60)}`, html }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return Boolean(sent?.delivered);
  } catch (error) {
    console.warn("[REGISTRATION ALERT FAILED]", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Why someone left, as offered in the delete dialog. Anything else is stored as OTHER. */
export const LEAVING_REASONS = ["TOO_FEW_PEOPLE", "NOT_WHAT_I_EXPECTED", "PRIVACY", "FOUND_SOMEONE", "JUST_TRYING", "OTHER"] as const;
export type LeavingReason = (typeof LEAVING_REASONS)[number];
const REASON_WORDS: Record<LeavingReason, string> = {
  TOO_FEW_PEOPLE: "Too few people here yet",
  NOT_WHAT_I_EXPECTED: "Not what I expected",
  PRIVACY: "Privacy worries",
  FOUND_SOMEONE: "Found someone",
  JUST_TRYING: "Just trying it out",
  OTHER: "Other",
};
export function cleanLeavingReason(value: unknown): LeavingReason | null {
  return typeof value === "string" && (LEAVING_REASONS as readonly string[]).includes(value) ? (value as LeavingReason) : null;
}

export type LeavingMember = { profileId: string; displayName: string; joinedAt: string | null; reason: LeavingReason | null; note: string | null };

/** Tells the team someone deleted their account, with their optional reason. Never throws. */
export async function notifyAccountDeleted(member: LeavingMember): Promise<boolean> {
  if (REGISTRATION_ALERT_TO === "off") return false;
  const joined = member.joinedAt ? new Date(member.joinedAt) : null;
  const minutes = joined ? Math.max(0, Math.round((Date.now() - joined.getTime()) / 60000)) : null;
  const stayed = minutes === null ? "unknown" : minutes < 120 ? `${minutes} min` : minutes < 2880 ? `${Math.round(minutes / 60)} h` : `${Math.round(minutes / 1440)} days`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#191C20">
<p style="margin:0 0 12px"><strong>A member deleted their account</strong></p>
<p style="margin:0">${escape(member.displayName)} · was a member for ${stayed}</p>
<p style="margin:0">Reason: ${member.reason ? REASON_WORDS[member.reason] : "not given"}</p>
${member.note ? `<p style="margin:8px 0 0;padding:8px 12px;border-left:3px solid #A8D5EF;background:#f3f6f8">${escape(member.note)}</p>` : ""}
<p style="margin:16px 0 0;color:#5b6570">profile ${escape(member.profileId)}</p>
</div>`;
  try {
    const sent = await Promise.race([
      ResendClient.sendEmail({ to: REGISTRATION_ALERT_TO, subject: `Member left: ${member.displayName.slice(0, 60)}${member.reason ? ` (${REASON_WORDS[member.reason]})` : ""}`, html }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return Boolean(sent?.delivered);
  } catch (error) {
    console.warn("[LEAVING ALERT FAILED]", error instanceof Error ? error.message : error);
    return false;
  }
}
