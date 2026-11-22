import { ResendClient } from "@/lib/notifications/resendClient";

/** Where new invitation requests go. Override with INVITATION_REQUEST_ALERT_EMAIL. */
export const INVITATION_REQUEST_ALERT_TO = process.env.INVITATION_REQUEST_ALERT_EMAIL || "registration@intimo.live";

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


/** Branded administrator email, using docs/brand/BRAND.md and a safe, read-only review link. */
export function adminInvitationRequestEmail(request: InvitationRequestInput & { id: string }) {
  // Staff notifications are always in English, irrespective of applicant language.
  // Preserve the applicant's own words verbatim: translations can change intent.
  const review = `https://intimo.live/admin/invitations?request=${encodeURIComponent(request.id)}`;
  const identity = IDENTITIES[request.identity];
  const location = BASED_IN[request.basedIn];
  const subject = `Intimo · New request · ${identity}, ${location}`;
  const kicker = "New invitation request";
  const heading = "Someone is";
  const turn = "at the door.";
  const person = "Applicant";
  const lookingFor = "Message (original)";
  const cta = "Review application";
  const note = "Approving sends a personal invitation. Rejecting sends no email.";
  const tagline = "Boundaries first. Then chemistry.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#191C20;color:#F1E8DC;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#191C20;border-collapse:collapse"><tr><td align="center" style="padding:38px 16px 48px">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;border-collapse:collapse">
<tr><td style="padding:0 0 32px"><a href="https://intimo.live" style="display:inline-block"><img src="https://intimo.live/brand/intimo-logo-dark@3x.png" width="164" alt="Intimo" style="display:block;width:164px;max-width:100%;height:auto;border:0"></a></td></tr>
<tr><td style="background:#252B31;border:1px solid #46525E;padding:44px 34px 38px">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr><td style="font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#A8D5EF;padding-bottom:24px">${kicker}</td></tr>
<tr><td style="font-family:'Instrument Serif',Georgia,'Times New Roman',serif;font-weight:400;font-size:45px;line-height:1.07;letter-spacing:-1px;color:#F1E8DC;padding-bottom:28px">${heading}<br><span style="font-style:italic;color:#E0704F">${turn}</span></td></tr>
<tr><td style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#A9A39E;padding-bottom:8px">${person}</td></tr>
<tr><td style="font-size:19px;line-height:1.5;color:#F1E8DC;overflow-wrap:anywhere;word-break:break-word;padding-bottom:12px">${escapeHtml(request.email)}</td></tr>
<tr><td style="font-size:14px;color:#CFC7BC;padding-bottom:26px">${identity} · ${location} · ${request.language === "cs" ? "Czech" : "English"}</td></tr>
<tr><td style="border-top:1px solid #46525E;padding-top:24px;font-size:11px;letter-spacing:2px;color:#A9A39E;text-transform:uppercase;padding-bottom:12px">${lookingFor}</td></tr>
<tr><td style="font-family:'Instrument Serif',Georgia,serif;font-size:25px;font-style:italic;font-weight:400;line-height:1.45;color:#F1E8DC;padding-bottom:28px;overflow-wrap:anywhere">${escapeHtml(request.intent)}</td></tr>
<tr><td style="padding-bottom:24px"><a href="${review}" style="display:inline-block;border-radius:999px;background:#E0704F;color:#191C20;padding:15px 26px;font-size:14px;font-weight:600;text-decoration:none">${cta}</a></td></tr>
<tr><td style="border-top:1px solid #46525E;padding-top:20px;font-size:12px;line-height:1.65;color:#A9A39E">${note}</td></tr>
</table></td></tr>
<tr><td style="padding:26px 3px 9px;font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:20px;color:#F1E8DC">${tagline}</td></tr>
<tr><td style="padding:0 3px;font-size:11px;line-height:1.6;color:#A9A39E">Intimo · Internal administrator notification</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html };
}

/** Tells the team a request arrived. Never throws and never waits more than 4 seconds. */
export async function notifyInvitationRequest(request: InvitationRequestInput & { id: string }): Promise<boolean> {
  if (INVITATION_REQUEST_ALERT_TO === "off") return false;
  const { subject, html } = adminInvitationRequestEmail(request);
  try {
    const sent = await Promise.race([
      ResendClient.sendEmail({ to: INVITATION_REQUEST_ALERT_TO, subject, html }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return Boolean(sent?.delivered && sent.provider === "RESEND_API");
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


/**
 * Invitation request receipt. Uses the official 2026 Intimo overlap lockup,
 * palette and typographic hierarchy from docs/brand/BRAND.md.
 * No implied approval, expiry deadline or invented activity.
 */
export function invitationRequestReceiptEmail(language: "en" | "cs") {
  const cs = language === "cs";
  const copy = cs
    ? {
        subject: "Tvoji žádost jsme přijali · Intimo",
        preheader: "Žádost o pozvánku je u nás. Další krok je na nás.",
        kicker: "Žádost přijata",
        line1: "Dveře jsou zatím",
        line2: "pootevřené.",
        greeting: "Díky, že ses ozval(a).",
        body: "Tvoji žádost o pozvánku jsme přijali. Teď ji projdeme.",
        detail: "Intimo je soukromá komunita pro dospělé. Pokud ti pozvánku schválíme, přijde ti další e-mail s osobním odkazem.",
        button: "Prohlédnout Intimo",
        note: "Teď už nemusíš dělat nic dalšího.",
        footer: "Tento e-mail ti přišel, protože jsi na intimo.live požádal(a) o pozvánku. Intimo je určeno pouze osobám starším 18 let.",
        tagline: "Hranice první. Pak chemie.",
      }
    : {
        subject: "We received your request · Intimo",
        preheader: "Your invitation request is in. The next step is ours.",
        kicker: "Request received",
        line1: "The door is",
        line2: "slightly open.",
        greeting: "Thanks for reaching out.",
        body: "We've received your invitation request. We'll review it from here.",
        detail: "Intimo is a private adults-only community. If your request is approved, we'll email you a personal invitation link.",
        button: "Explore Intimo",
        note: "There's nothing else you need to do right now.",
        footer: "You received this email because you requested an invitation at intimo.live. Intimo is for adults aged 18+.",
        tagline: "Boundaries first. Then chemistry.",
      };
  const html = `<!doctype html>
<html lang="${cs ? "cs" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${copy.subject}</title></head>
<body style="margin:0;padding:0;background-color:#191C20;color:#F1E8DC;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${copy.preheader}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#191C20;border-collapse:collapse;">
<tr><td align="center" style="padding:38px 16px 48px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;border-collapse:collapse;">
<tr><td style="padding:0 0 32px;">
<a href="https://intimo.live" aria-label="Intimo" style="display:inline-block;text-decoration:none;">
<img src="https://intimo.live/brand/intimo-logo-dark@3x.png" width="164" alt="Intimo" style="display:block;width:164px;max-width:100%;height:auto;border:0;">
</a></td></tr>
<tr><td style="background-color:#252B31;border:1px solid #46525E;padding:44px 34px 38px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr><td style="font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#A8D5EF;padding-bottom:24px;">${copy.kicker}</td></tr>
<tr><td style="font-family:'Instrument Serif',Georgia,'Times New Roman',serif;font-size:46px;line-height:1.05;font-weight:400;letter-spacing:-1px;color:#F1E8DC;padding:0 0 28px;">${copy.line1}<br><span style="font-style:italic;color:#E0704F;">${copy.line2}</span></td></tr>
<tr><td style="font-size:16px;line-height:1.7;color:#F1E8DC;padding:0 0 12px;">${copy.greeting}</td></tr>
<tr><td style="font-size:15px;line-height:1.8;color:#CFC7BC;padding:0 0 14px;">${copy.body}</td></tr>
<tr><td style="font-size:15px;line-height:1.8;color:#CFC7BC;padding:0 0 30px;">${copy.detail}</td></tr>
<tr><td style="padding:0 0 24px;"><a href="https://intimo.live" style="display:inline-block;background-color:#E0704F;color:#191C20;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;padding:15px 26px;">${copy.button}</a></td></tr>
<tr><td style="border-top:1px solid #46525E;padding-top:20px;font-size:13px;line-height:1.6;color:#A9A39E;">${copy.note}</td></tr>
</table></td></tr>
<tr><td style="padding:26px 3px 10px;font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:20px;color:#F1E8DC;">${copy.tagline}</td></tr>
<tr><td style="font-size:11px;line-height:1.65;color:#A9A39E;padding:0 3px;">${copy.footer}</td></tr>
<tr><td style="padding:17px 3px 0;font-size:11px;"><a href="https://intimo.live" style="color:#A8D5EF;text-decoration:underline;">intimo.live</a></td></tr>
</table></td></tr></table>
</body></html>`;
  return { subject: copy.subject, html };
}

/** Send only for a newly stored request; do not turn delivery issues into duplicate requests. */
export async function sendInvitationRequestReceipt(request: InvitationRequestInput): Promise<boolean> {
  const email = invitationRequestReceiptEmail(request.language);
  try {
    const result = await ResendClient.sendEmail({ to: request.email, subject: email.subject, html: email.html });
    return result.delivered && result.provider === "RESEND_API";
  } catch {
    console.warn("[INVITATION REQUEST RECEIPT FAILED]");
    return false;
  }
}
