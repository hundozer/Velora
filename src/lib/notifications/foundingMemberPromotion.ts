import { ResendClient } from "./resendClient";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char] || char));

export function foundingMemberPromotionEmail(name: string, language: "cs" | "en" = "en") {
  const nickname = escapeHtml(name.slice(0, 80) || "there");
  const cs = language === "cs";
  const subject = cs ? "Jsi zakládajícím členem Intimo 👑" : "You're officially an Intimo Founding Member 👑";
  const eyebrow = cs ? "VÍTEJ MEZI ZAKLÁDAJÍCÍMI ČLENY" : "WELCOME TO THE INNER CIRCLE";
  const heading = cs ? "Už nejsi jen členem." : "You're not just a member anymore.";
  const greeting = cs ? `Ahoj ${nickname},` : `Hey ${nickname},`;
  const promoted = cs ? "Právě jsi získal(a) status zakládajícího člena Intimo." : "You've just been promoted to Founding Member of Intimo.";
  const meaning = cs ? "Budujeme místo pro skutečné lidi, skutečnou chemii a spojení bez placených překážek. A rádi bychom, abys nám pomohl(a) vytvořit komunitu od samého začátku." : "We're building something different. A place for real people, real chemistry, and connections without paywalls. We'd love you to help shape the community from the very beginning.";
  const heading2 = cs ? "Co ti členství přináší" : "Your Founding Member privileges";
  const perks = cs ? ["Trvalé uznání zakládajícího člena", "Neomezené osobní pozvánky pro lidi, kteří o ně stojí", "Vlastní sekci zakládajícího člena v profilu"] : ["Permanent Founding Member recognition", "Unlimited personal invitations to people who want them", "Your own Founding Member area in your account"];
  const invite = cs ? "Znáš někoho, kdo by sem patřil? Pozvi ho osobně. Žádné poplatky, žádný nátlak." : "Know someone who belongs here? Invite them personally. No fees, no awkward sales pitch.";
  const cta = cs ? "Otevřít sekci zakládajícího člena" : "Open your Founding Member area";
  const footer = cs ? "Najdeš ji také v menu účtu → Zakládající člen" : "You can also find it in your account menu → Founding Member";
  const closing = cs ? "Nejlepší komunity nevytvářejí algoritmy. Vytvářejí je lidé.\n\nTým Intimo" : "The best communities aren't built by algorithms. They're built by people who give a damn.\n\nThe Intimo Team";
  const html = `<!doctype html><html lang="${language}"><body style="margin:0;background:#101317;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#F4F6F7">
<table role="presentation" style="margin:0 auto;max-width:560px;width:100%;background:#1A2026;border:1px solid #394550;border-radius:18px" cellpadding="0" cellspacing="0"><tr><td style="padding:38px 30px">
<div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px">intimo<span style="color:#A9D8EE">●</span></div>
<p style="margin:40px 0 12px;font-size:11px;letter-spacing:2px;color:#A9D8EE">${eyebrow}</p>
<h1 style="font-size:34px;line-height:1.1;margin:0 0 28px;color:#fff">${heading}</h1>
<p style="font-size:16px;line-height:1.6;color:#D6DEE2">${greeting}</p>
<p style="font-size:16px;line-height:1.6;color:#D6DEE2">${promoted}</p>
<p style="font-size:16px;line-height:1.6;color:#D6DEE2">${meaning}</p>
<div style="padding:22px;margin:28px 0;border-radius:12px;background:#27313A">
<strong style="color:#A9D8EE">${heading2}</strong>
<ul style="color:#EEF2F4;line-height:1.9;padding-left:20px">${perks.map(p=>`<li>${p}</li>`).join("")}</ul>
</div>
<p style="font-size:16px;line-height:1.6;color:#D6DEE2">${invite}</p>
<p style="margin:30px 0 12px"><a href="https://intimo.live/founding-member" style="display:inline-block;background:#A9D8EE;color:#14232D;text-decoration:none;padding:15px 24px;border-radius:9px;font-weight:700">${cta}</a></p>
<p style="font-size:12px;color:#AAB5BE">${footer}</p>
<p style="margin:28px 0 0;white-space:pre-line;font-size:14px;line-height:1.8;color:#D6DEE2">${closing}</p>
</td></tr></table><p style="text-align:center;color:#AAB5BE;font-size:11px">Intimo · Free to join · Adults 18+ · intimo.live</p></body></html>`;
  return { subject, html };
}

export async function sendFoundingMemberPromotionEmail(to: string, name: string, language: "cs" | "en" = "en") {
  const message = foundingMemberPromotionEmail(name, language);
  return ResendClient.sendEmail({ to, ...message });
}
