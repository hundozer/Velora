import { ResendClient } from "./resendClient";

/** Where urgent safety alerts go. Override with SAFETY_ALERT_EMAIL; "off" stops them. */
export const SAFETY_ALERT_TO = process.env.SAFETY_ALERT_EMAIL || "admin@intimo.live";

const LABELS: Record<string, string> = {
  SUSPECTED_MINOR: "Suspected minor",
  NON_CONSENSUAL_INTIMATE_CONTENT: "Non-consensual intimate content",
  EXPLOITATION_TRAFFICKING: "Exploitation or trafficking",
};

/**
 * FM-07: tells the team at once about a report with a 1-hour target. Only the category and a
 * case reference: no names, descriptions or content, so the email itself is never sensitive.
 * Never throws and never delays the report by more than a few seconds.
 */
export async function notifySafetyTeam(report: { caseId: string; reason: string; createdAt: string }): Promise<boolean> {
  if (SAFETY_ALERT_TO === "off") return false;
  const label = LABELS[report.reason] || "Urgent report";
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Prague" }).format(new Date(report.createdAt));
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#191C20">
<p style="margin:0 0 12px"><strong>Urgent report on Intimo: decide within 1 hour</strong></p>
<p style="margin:0">${label}</p>
<p style="margin:0 0 16px;color:#5b6570">Received ${when} (Prague time)</p>
<p style="margin:0"><a href="https://intimo.live/admin/reports" style="color:#1f6f9c">Open the report queue</a> · case ${report.caseId.replace(/[^0-9a-f-]/gi, "")}</p>
</div>`;
  try {
    const sent = await Promise.race([
      ResendClient.sendEmail({ to: SAFETY_ALERT_TO, subject: `Urgent report: ${label}`, html }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return Boolean(sent?.delivered);
  } catch (error) {
    console.warn("[SAFETY ALERT FAILED]", error instanceof Error ? error.message : error);
    return false;
  }
}
