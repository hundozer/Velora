import { ResendClient } from "@/lib/notifications/resendClient";

/** Where new invitation requests go. Override with INVITATION_REQUEST_ALERT_EMAIL. */
export const INVITATION_REQUEST_ALERT_TO = process.env.INVITATION_REQUEST_ALERT_EMAIL || "admin@intimo.live";

// The three questions on the landing page form. Keep this list at three.
export const IDENTITIES = { WOMAN: "A woman", MAN: "A man", COUPLE: "A couple", OTHER: "Non-binary or other" } as const;
export const BASED_IN = { PRAGUE: "Prague", CZECHIA: "Elsewhere in Czechia", ABROAD: "Outside Czechia" } as const;
export type Identity = keyof typeof IDENTITIES;
export type BasedIn = keyof typeof BASED_IN;

export type InvitationRequestInput = { email: string; identity: Identity; basedIn: BasedIn; intent: string; language: "en" | "cs" };

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Validates the public form. Returns null for anything malformed. */
export function parseInvitationRequest(body: unknown): InvitationRequestInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const intent = typeof b.intent === "string" ? b.intent.replace(/\s+/g, " ").trim() : "";
  if (email.length > 254 || !emailPattern.test(email)) return null;
  if (typeof b.identity !== "string" || !(b.identity in IDENTITIES)) return null;
  if (typeof b.basedIn !== "string" || !(b.basedIn in BASED_IN)) return null;
  if (intent.length < 10 || intent.length > 500) return null;
  if (b.adultConfirmed !== true) return null;
  return { email, identity: b.identity as Identity, basedIn: b.basedIn as BasedIn, intent, language: b.language === "cs" ? "cs" : "en" };
}

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Tells the team a request arrived. Never throws and never waits more than 4 seconds. */
export async function notifyInvitationRequest(request: InvitationRequestInput & { id: string }): Promise<boolean> {
  if (INVITATION_REQUEST_ALERT_TO === "off") return false;
  const review = `https://intimo.live/admin/invitations?request=${encodeURIComponent(request.id)}`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#191C20">
<p style="margin:0 0 12px"><strong>New invitation request</strong></p>
<p style="margin:0">${escapeHtml(request.email)}</p>
<p style="margin:0">${IDENTITIES[request.identity]} · ${BASED_IN[request.basedIn]} · ${request.language === "cs" ? "Czech" : "English"}</p>
<p style="margin:12px 0;padding:12px;border-left:3px solid #a9d8ee;background:#f4f7f9">${escapeHtml(request.intent)}</p>
<p style="margin:16px 0"><a href="${review}" style="display:inline-block;border-radius:8px;background:#1f6f9c;color:#fff;padding:10px 18px;font-weight:bold;text-decoration:none">Approve or reject</a></p>
<p style="margin:0;color:#5b6570;font-size:13px">Approving sends a personal invitation from Intimo. Rejecting sends nothing.</p>
</div>`;
  try {
    const sent = await Promise.race([
      ResendClient.sendEmail({ to: INVITATION_REQUEST_ALERT_TO, subject: `Invitation request: ${IDENTITIES[request.identity]}, ${BASED_IN[request.basedIn]}`, html }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return Boolean(sent?.delivered);
  } catch (error) {
    console.warn("[INVITATION REQUEST ALERT FAILED]", error instanceof Error ? error.message : error);
    return false;
  }
}

/** The personal invitation sent when a request is approved, in the language they used. */
export function approvedInvitationEmail(token: string, language: "en" | "cs") {
  const url = `https://intimo.live/register?invite=${encodeURIComponent(token)}`;
  const cs = language === "cs";
  const copy = cs
    ? { kicker: "Osobní pozvánka", title: "Rádi tě uvítáme<br/>v Intimu.", p1: "Děkujeme, že ses ozval(a). Přečetli jsme si tvou žádost a rádi bychom tě mezi sebou viděli.", p2: "Intimo je bezplatná komunita jen pro dospělé, pro opravdová setkání, zvědavost a otevřené lidi.", cta: "Přijmout pozvánku", note: "Pozvánka platí 30 dní a jen pro tuto e-mailovou adresu.", footer: "Intimo je jen pro lidi starší 18 let. Tento e-mail ti přišel, protože jsi na intimo.live požádal(a) o pozvánku. Nejsi přihlášen(a) k odběru žádných novinek.", subject: "Tvoje osobní pozvánka do Intima" }
    : { kicker: "A personal invitation", title: "We'd love to<br/>have you.", p1: "Thank you for reaching out. We read your request and we'd like you to join us.", p2: "Intimo is a free, adults-only community for genuine connections, curiosity, and open-minded people.", cta: "Accept your invitation", note: "This invitation is valid for 30 days and only for this email address.", footer: "Intimo is for adults aged 18+. You received this email because you asked for an invitation on intimo.live. You are not subscribed to a mailing list.", subject: "Your personal invitation to Intimo" };
  const html = `<div style="background:#101317;padding:36px 16px;font-family:Arial,Helvetica,sans-serif;color:#f1f3f5">
  <div style="max-width:520px;margin:auto;border:1px solid #333d46;border-radius:18px;background:#1a2026;padding:36px 28px">
    <p style="font-size:28px;font-weight:800;letter-spacing:-1px;margin:0;color:#ffffff">intimo<span style="color:#a9d8ee">●</span></p>
    <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a9d8ee;margin-top:36px">${copy.kicker}</p>
    <h1 style="font-size:32px;line-height:1.15;letter-spacing:-1px;margin:10px 0 18px;color:white">${copy.title}</h1>
    <p style="font-size:16px;line-height:1.7;color:#d3d9dd">${copy.p1}</p>
    <p style="font-size:16px;line-height:1.7;color:#d3d9dd">${copy.p2}</p>
    <p style="margin:32px 0"><a href="${url}" style="display:inline-block;border-radius:8px;background:#a9d8ee;color:#16232b;padding:15px 25px;font-size:15px;font-weight:bold;text-decoration:none">${copy.cta}</a></p>
    <p style="font-size:13px;color:#91a0ab">${copy.note}</p>
  </div>
  <p style="max-width:520px;margin:20px auto 0;font-size:11px;line-height:1.6;color:#a9b4bd">${copy.footer}</p>
</div>`;
  return { subject: copy.subject, html };
}
