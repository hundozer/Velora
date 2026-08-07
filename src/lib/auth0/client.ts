import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Server-side Auth0 SDK client instance initialized with environment variables
 */
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, ""),
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
  authorizationParameters: process.env.AUTH0_AUDIENCE
    ? { audience: process.env.AUTH0_AUDIENCE, scope: "openid profile email" }
    : { scope: "openid profile email" },
  enableAccessTokenEndpoint: false,
  session: {
    rolling: true,
    inactivityDuration: 60 * 60 * 24,
    absoluteDuration: 60 * 60 * 24 * 7,
    cookie: { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
  },
});
