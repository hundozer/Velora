# Intimo Demo Content Policy

Intimo may use synthetic profiles only in a non-production staging environment for product and usability testing.

## Required controls

- Every synthetic record has `is_demo=true`, uses an `intimo.invalid` email, and visibly identifies itself as a demo profile.
- Demo profiles are fictional and must never be described as real members, verified users, active users, customers, or social proof.
- Demo profiles cannot receive direct messages, show online presence, hold verified status, or carry simulated engagement counts.
- Explicit, intimate, or real-person imagery is not used. Initials and inexpensive abstract placeholders are sufficient for layout testing.
- The seed refuses to run unless the operator explicitly declares a staging environment, a matching staging Supabase project ref, and the confirmation phrase.
- If a production project ref is supplied and matches the staging ref, the seed refuses to run.
- Removal targets only records with both `is_demo=true` and the reserved `demo|staging|` Auth0 prefix.

## Operation

Apply the marker migration first. Then, from a secured local shell with staging-only credentials:

```bash
INTIMO_ENVIRONMENT=staging \
INTIMO_STAGING_SUPABASE_PROJECT_REF=your-staging-ref \
INTIMO_PRODUCTION_SUPABASE_PROJECT_REF=your-production-ref \
INTIMO_DEMO_SEED_CONFIRMATION=SEED_INTIMO_STAGING_DEMOS \
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run demo:seed:staging
```

Remove the fixtures with the same safeguards using `npm run demo:remove:staging`.

Never paste service-role credentials into tickets, chat, screenshots, source control, or browser-visible environment variables.
