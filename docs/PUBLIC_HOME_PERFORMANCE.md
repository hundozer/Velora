# Public home loading

21 October 2026; baseline main `fe1cbb042d59a94a8b4966f86ea4f6a3d76b42c1`.

The public landing previously returned a blank viewport until AuthContext finished its session request.
The hero image therefore could not be discovered in the original HTML. PublicCommunityHome is now a
server component passed into a small client HomeExperience boundary. The headline, signup links and
priority hero are present in anonymous HTML, independently of JavaScript or session-response timing.
The member feed is dynamically imported only when AuthContext resolves a member.

The home route reads cookie names to choose the initial loading state for likely returning members.
Both whole and numbered Supabase auth-cookie names are recognised. Cookie presence is a presentation
hint only: no token is decoded or trusted, no member information is rendered server-side, and existing
session/profile/API verification is unchanged. Invalid cookies fall back to public home after the
session response, including service-unavailable responses. Reading cookies makes this route dynamic;
no public or authenticated response caching override is added.

Verification: 206 source tests, TypeScript and ESLint pass. Ten fixture-based Playwright UI tests pass:
public HTML with JavaScript disabled; hero/headline available with the session request held pending;
member loading then feed after verified-session/profile fixtures; invalid-cookie 401/503 fallback with
no feed request; existing age-gate keyboard, signup navigation, photo loading and overflow checks at
375/390/1440 px, plus About at 375/1440 px. Command:
`E2E_BASE_URL=http://localhost:3000 npx playwright test home-loading landing-truth --project=ui --trace=off`.
These fixtures verify rendering behavior, not a new live member-acceptance run.

The earlier production browser measurement at 390 px used a 1.6 Mbps / 150 ms / 4x CPU simulation,
disabled browser cache and an established connection: hero LCP 2548 ms. First-connection measurements
were dominated by this execution environment's proxy/TLS setup (approximately 9 seconds), so they
must not be described as representative Prague-user loading times. PageSpeed API returned quota429.
Deployment comparison and final CI/HTTP results are recorded in the focused PR; lab results are not
real-user Core Web Vitals or a production speed guarantee.
