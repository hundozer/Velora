# Future monetization boundary

Current invariant: `MONETIZATION_ENABLED=false`. Payments, subscriptions, premium tiers, wallet/balance, tips, commissions, paid content, refunds, payouts and paid creator services must remain hidden and server-inaccessible. Dormant legacy code is not permission to expose any feature.

Future enablement requires a separate product decision and legal/security project: entity/tax/VAT review, payment-processor adult-content approval, KYC/KYB and sanctions controls, SCA/payment security, consumer price/renewal/cancellation/refund terms, chargebacks/fraud, creator agreements, payout holds/reserves, financial ledger/reconciliation, minor/consent safeguards, complaint handling, privacy/DPIA updates, localized disclosures and automated tests. Each capability needs its own feature flag and server authorization; a single UI toggle is insufficient.

No payment credential, live provider mode, migration or deployment has been configured or performed by this remediation.
