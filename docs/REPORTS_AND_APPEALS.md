# Reports, decisions and appeals (FM-07)

How Intimo handles a report, following the EU Digital Services Act (Art. 16 notices, Art. 17
statements of reasons, Art. 20 internal complaints). Rules live in
`src/lib/moderation/outcomes.mjs`.

## 1. A member reports something

The report form (`ReportModal`) records what, why and a description. Priority follows the
reason:

| Priority | Reasons | Target |
|---|---|---|
| Critical | Suspected minor, non-consensual intimate content, exploitation or trafficking | **1 hour** |
| High | Threats, illegal content | 12 hours |
| Standard | Everything else | 12 hours |

Critical reports email the team at once (`SAFETY_ALERT_EMAIL`, default `admin@intimo.live`;
`off` disables it). The email carries only the category and a case reference.

## 2. An admin decides (Admin → Reports)

The work inbox shows the deadline; overdue reports are marked and move to the top.

- **Breach: take action.** Choose what was done (warning, content removed, features restricted,
  suspended, closed), the guideline it relies on, and write an explanation **for the reported
  member**. Then apply the action itself (Admin → Users, or on the content).
- **No breach.** Only an internal note.

Every decision keeps the internal note, the reviewer and the time in `moderation_events` and the
audit log. A decided case can't be re-decided from the queue: a change goes through an appeal.

## 3. Who is told what

| Who | When | What |
|---|---|---|
| Reporter | Every final decision | "We took action" or "no breach found". Never what happened to the other member. |
| Reported member | Only when action was taken | A notice, and in Settings → Privacy Center a **statement of reasons**: the action, the guideline, the explanation, the date, and that a person decided. |
| Reported member | Open or dismissed reports | Nothing. They never learn who reported. |

## 4. Appeals

The reported member (when action was taken) or the reporter (for any outcome) can ask once for
a review, from Settings → Privacy Center. The admin sees the appeal with the original decision
and chooses **uphold**, **change part of it** or **reverse**, with an explanation for the member
who appealed. If possible someone other than the original reviewer decides; when it's the same
person, the audit log records it. Reversing an account action is then done in Admin → Users.

## Not yet done

- Stopping banned people from coming back with a new invitation (ban evasion).
- Reversing account actions automatically when an appeal succeeds.
- Out-of-court dispute settlement bodies and the transparency report (needed before the public
  launch, with the legal review).
