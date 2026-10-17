# Analytics privacy contract

Optional analytics is disabled until cookie consent and a provider are approved.
No marketing tracker is configured for the free MVP.

Allowed events must be coarse operational events such as page type, successful
registration, onboarding step completion, search execution, message send success
and report submission success. They must not include:

- sexual orientation, interests, preferences or relationship details;
- private profile fields, messages or report descriptions;
- exact location or raw coordinates;
- private media URLs, object keys or identifiers;
- email, Auth0 subject, display name or stable cross-service identifiers.

Event payloads require a code review against this contract. Optional events must
not be emitted before `intimo_cookie_consent.analytics` is true. Server security,
fraud and audit logs are necessary processing and must follow their own purpose,
access and retention controls rather than being repurposed for product analytics.
