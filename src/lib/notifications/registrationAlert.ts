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
