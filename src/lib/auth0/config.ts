/**
 * Enterprise Auth0 Identity Provider Configuration for Velora / Intimo
 * Connects Auth0 Universal Login, social identity providers (Google, Apple, Facebook), and OAuth token issuer.
 */

export interface Auth0EnvironmentConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  secret: string;
  baseUrl: string;
  issuer: string;
  callbackUrl: string;
  logoutUrl: string;
  allowedOrigins: string[];
  socialConnections: {
    google: string;
    apple: string;
    facebook: string;
  };
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

const BASE_URL = process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DOMAIN = required("AUTH0_ISSUER_BASE_URL").replace(/\/$/, "");

export const AUTH0_CONFIG: Auth0EnvironmentConfig = {
  domain: DOMAIN,
  clientId: required("AUTH0_CLIENT_ID"),
  clientSecret: required("AUTH0_CLIENT_SECRET"),
  secret: required("AUTH0_SECRET"),
  baseUrl: BASE_URL,
  issuer: DOMAIN.endsWith("/") ? DOMAIN : `${DOMAIN}/`,
  callbackUrl: `${BASE_URL}/auth/callback`,
  logoutUrl: `${BASE_URL}/login`,
  allowedOrigins: [
    BASE_URL,
    "https://intimo.live",
    "https://velora-six-ashen.vercel.app",
    "https://velora.club",
    "https://api.intimo.club",
  ],
  socialConnections: {
    google: "google-oauth2",
    apple: "apple",
    facebook: "facebook",
  },
};
