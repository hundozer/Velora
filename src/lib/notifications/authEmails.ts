type Kind = "confirm" | "signin" | "recovery";

const COPY: Record<Kind, { subject: string; heading: string; body: string; cta: string }> = {
  confirm: { subject: "Confirm your Intimo account", heading: "Confirm your email", body: "Tap the button to confirm your address and finish setting up your profile.", cta: "Confirm email" },
  signin: { subject: "Your Intimo sign-in link", heading: "Sign in to Intimo", body: "Tap the button to sign in. If you didn't ask for this, you can ignore this email.", cta: "Sign in" },
  recovery: { subject: "Reset your Intimo password", heading: "Reset your password", body: "Tap the button to choose a new password. The link expires in one hour.", cta: "Choose a new password" },
};

function escape(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Discreet auth email: no explicit content, sender name only "Intimo". */
export function authEmail(kind: Kind, url: string): { subject: string; html: string } {
  const c = COPY[kind];
  const href = escape(url);
  return {
    subject: c.subject,
    html: `<!doctype html><html><body style="margin:0;background:#0b0d12;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#f4efe6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#141821;border:1px solid #2a2f3a;border-radius:16px"><tr><td style="padding:32px">
<p style="margin:0 0 8px;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#d4af37">Intimo</p>
<h1 style="margin:0 0 12px;font-size:22px">${c.heading}</h1>
<p style="margin:0 0 24px;line-height:1.5;color:#c9c2b6">${c.body}</p>
<a href="${href}" style="display:inline-block;background:#d4af37;color:#0b0d12;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:999px">${c.cta}</a>
<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#8a8478">Or paste this link into your browser:<br><span style="word-break:break-all">${href}</span></p>
</td></tr></table></td></tr></table></body></html>`,
  };
}
