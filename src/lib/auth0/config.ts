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
  audience?: string;
  callbackUrl: string;
  logoutUrl: string;
  allowedOrigins: string[];
  socialConnections: {
    google: string;
    apple: string;
    facebook: string;
  };
}

const BASE_URL = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DOMAIN = process.env.AUTH0_ISSUER_BASE_URL || "https://simpleafiedeu.eu.auth0.com";

export const AUTH0_CONFIG: Auth0EnvironmentConfig = {
  domain: DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID || "2wfjGUy76NmH8rdoxXxqg8CrbchkutTl",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "pLz9jWA2wxZszV6AzQpYzVX7GkL-7uSdELBAsskUD8RyjznX-aSDuX9i91cooW0F",
  secret: process.env.AUTH0_SECRET || "velora_long_session_secret_cookie_key_32bytes!",
  baseUrl: BASE_URL,
  issuer: DOMAIN.endsWith("/") ? DOMAIN : `${DOMAIN}/`,
  audience: process.env.AUTH0_AUDIENCE || "https://api.velora.club",
  callbackUrl: `${BASE_URL}/api/auth/callback`,
  logoutUrl: `${BASE_URL}/login`,
  allowedOrigins: [
    BASE_URL,
    "https://intimo.live",
    "https://velora.club",
    "https://api.velora.club",
  ],
  socialConnections: {
    google: "google-oauth2",
    apple: "apple",
    facebook: "facebook",
  },
};
