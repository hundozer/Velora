import { ResendClient } from "./resendClient";

/** Where new-member alerts go. Override with REGISTRATION_ALERT_EMAIL; set it to "off" to stop them. */
export const REGISTRATION_ALERT_TO = process.env.REGISTRATION_ALERT_EMAIL || "registration@intimo.live";

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export type NewMember = { profileId: string; displayName: string; profileType: string; areaName: string | null; createdAt: string; invitationLabel?: string | null };

/**
 * Tells the team someone joined. Deliberately minimal: no email address, birth date,
 * orientation, desires or photos — only what's needed to notice and look them up in Admin.
 * Never throws and never delays registration by more than a few seconds.
 */
export async function notifyNewRegistration(member: NewMember): Promise<boolean> {
  if (REGISTRATION_ALERT_TO === "off") return false;
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Prague" }).format(new Date(member.createdAt));
  const name = escape(member.displayName);
  const invitation = typeof member.invitationLabel === "string" ? member.invitationLabel.trim().slice(0, 120) : "";
  const invitationRow = invitation ? `<p style="margin:8px 0 0"><strong>Invitation:</strong> ${escape(invitation)}</p>` : `<p style="margin:8px 0 0"><strong>Invitation:</strong> Personal invitation</p>`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#191C20">
<p style="margin:0 0 12px"><strong>New member on Intimo</strong></p>
<p style="margin:0">${name} · ${member.profileType === "COUPLE" ? "Couple" : "Individual"}${member.areaName ? ` · ${escape(member.areaName)}` : ""}</p>
${invitationRow}
<p style="margin:8px 0 16px"><strong>Status:</strong> Registered, awaiting age verification</p>
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

/** Only these six optional departure categories are accepted, never arbitrary free text. */
export const LEAVING_REASONS = ["TOO_FEW_PEOPLE", "NOT_WHAT_I_EXPECTED", "PRIVACY", "FOUND_SOMEONE", "JUST_TRYING", "OTHER"] as const;
export type LeavingReason = (typeof LEAVING_REASONS)[number];

export function cleanLeavingReason(value: unknown): LeavingReason | null {
  return typeof value === "string" && LEAVING_REASONS.some((reason) => reason === value) ? value as LeavingReason : null;
}

/** Privacy-minimal notification: no nickname, identifying profile ID, notes or intimate details. */
export async function notifyAccountDeleted({ reason }: { reason: LeavingReason | null }): Promise<boolean> {
  if (REGISTRATION_ALERT_TO === "off") return false;
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#191C20">
<p><strong>A member has left Intimo</strong></p>
<p>Optional reason category: ${escape(reason ?? "NOT_GIVEN")}</p>
<p>Review aggregate retention trends in Admin. No member identifiers are sent in this alert.</p>
</div>`;
  try {
    const sent = await Promise.race([
      ResendClient.sendEmail({ to: REGISTRATION_ALERT_TO, subject: "Intimo: a member left", html }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return Boolean(sent?.delivered);
  } catch {
    return false;
  }
}
