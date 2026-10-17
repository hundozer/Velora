# Future monetization (disabled)

Status: `MONETIZATION_DISABLED` for the Phase 1 free MVP.

Intimo launches as a free adults-only social discovery platform. The central
`MONETIZATION_ENABLED` flag is `false`; payment-only routes are blocked and
monetization controls must not be rendered or accepted by server APIs.

Live, events and creator-studio routes are also temporarily withheld by
`MVP_SAFETY_DISABLED_ROUTES` because their current implementations are mock or
local-only and contain payment assumptions. Creator profiles remain available.

The repository may retain dormant models and service adapters for a later,
separately approved phase. Retention avoids an unnecessary rewrite and does not
mean the features are available, configured, tested, or legally approved.

Future scope includes payments, premium memberships, subscriptions, premium
content, paid livestreams/events, tips, wallets, creator earnings and payouts,
VAT, DAC7, seller/trader verification, consumer digital-content rules, refunds,
chargebacks, commissions, platform fees, invoices, and payment-provider setup.

Before any future activation, Intimo requires a new security and privacy review,
qualified Czech/EU legal review, processor contracts, tax/accounting decisions,
consumer-law flows, payment-provider approval for the product category, threat
model updates, integration tests, and an explicit owner-approved deployment.

This document is planning material only. It is not legal advice and does not
claim regulatory compliance.
