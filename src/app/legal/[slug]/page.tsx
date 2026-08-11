import { notFound } from "next/navigation";
import Link from "next/link";

const POLICIES: Record<string, { title: string; sections: Array<[string, string]> }> = {
  "terms": { title: "Terms of Service", sections: [["Service", "Intimo is a free adults-only social discovery service. It is not a marketplace for paid offline sexual services."], ["Eligibility", "Accounts are limited to adults aged 18 or older. Age declaration is not the same as stronger age verification."], ["User responsibility", "Users are responsible for lawful, consensual conduct and content and for respecting privacy, blocking and safety controls."]]},
  "privacy-policy": { title: "Privacy Policy", sections: [["Data", "Intimo processes account, profile, preference, approximate location, communication, consent and safety data."], ["Sensitive data", "Sexual orientation and intimate preferences receive restricted access and separate consent controls."], ["Rights", "The Privacy Center provides correction, consent management, export and account deletion entry points."]]},
  "cookie-policy": { title: "Cookie Policy", sections: [["Necessary", "Authentication, security and consent storage may operate to provide the service."], ["Analytics", "Optional analytics must remain off until consent and must never include sexual preferences, private messages, exact location or private media identifiers."], ["Marketing", "Marketing tracking is not active in the free MVP."]]},
  "community-guidelines": { title: "Community Guidelines", sections: [["Consent", "Respect boundaries and stop contact when consent is withdrawn."], ["Safety", "Report suspected minors, non-consensual intimate content, exploitation, trafficking, threats and other illegal content immediately."], ["Conduct", "Harassment, scams, impersonation, doxxing, coercion and privacy violations are prohibited."]]},
  "acceptable-use": { title: "Acceptable Use Policy", sections: [["Prohibited", "Minors, suspected CSAM, exploitation, trafficking, NCII, secretly recorded intimate material, unlawful sexual violence, abusive impersonation, non-consensual sexual deepfakes, doxxing, threats, coercion and illegal content are prohibited."], ["Commercial services", "Escort booking, incall/outcall menus, hourly sexual-service pricing and prostitution marketplace activity are prohibited."]]},
  "content-policy": { title: "Content Policy", sections: [["Adult participants", "Uploaders must confirm every identifiable participant is an adult and consented to recording and publication."], ["Moderation evidence", "Intimo may request supporting participant consent and age evidence during moderation."], ["Visibility", "Free content may use public, members-only, followers-only, private or approved-users-only access."]]},
  "age-policy": { title: "Age Policy", sections: [["18+ only", "No minors are permitted on Intimo."], ["Assurance", "The MVP records age declaration separately from stronger age verification. Explicit adult content may require stronger assurance before launch."], ["Reporting", "Suspected minors are critical reports and are escalated immediately in the moderation queue."]]},
  "copyright-policy": { title: "Copyright Policy", sections: [["Notices", "Authenticated users can submit structured copyright notices identifying the claimant, content and complaint."], ["Review", "Notices, actions, counter-notices or appeals and resolutions are tracked."], ["Contact", "Copyright and support contact: contact@intimo.live."]]},
  "moderation": { title: "Moderation / Notice & Action", sections: [["Reports", "Profiles, media, messages, posts, comments, communities, events and livestreams can be reported using structured reasons."], ["Decisions", "Cases support open, review, action-required, resolved, rejected, appealed and escalated states."], ["Appeals", "Eligible affected users can submit an internal appeal for reassigned or independent review where appropriate."]]},
};

export function generateStaticParams() { return Object.keys(POLICIES).map((slug) => ({ slug })); }

export default function LegalDraftPage({ params }: { params: { slug: string } }) {
  const policy = POLICIES[params.slug];
  if (!policy) notFound();
  return <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
    <div><h1 className="text-3xl font-serif font-bold text-white">{policy.title}</h1><p className="mt-2 text-xs text-velora-textMuted">Intimo • contact@intimo.live • Last updated: 2026-08-07</p></div>
    {policy.sections.map(([title, body]) => <section key={title} className="space-y-2"><h2 className="text-lg font-bold text-velora-gold">{title}</h2><p className="text-sm leading-7 text-velora-textSecondary">{body}</p></section>)}
    <Link href="/settings" className="text-sm text-velora-gold underline">Open Privacy Center</Link>
  </main>;
}
