/**
 * Enterprise Auth0 Identity Provider Configuration for Velora
 * Connects Auth0 Universal Login, social identity providers (Google, Apple, Facebook), and OAuth token issuer.
 */

export interface Auth0EnvironmentConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  secret: string;
  baseUrl: string;
  audience: string;
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

const BASE_URL = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DOMAIN = process.env.AUTH0_ISSUER_BASE_URL || "https://velora-club.eu.auth0.com";

export const AUTH0_CONFIG: Auth0EnvironmentConfig = {
  domain: DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID || "velora_auth0_client_id_2026",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "velora_auth0_client_secret_2026",
  secret: process.env.AUTH0_SECRET || "velora_long_session_secret_cookie_key_32bytes!",
  baseUrl: BASE_URL,
  audience: process.env.AUTH0_AUDIENCE || "https://api.velora.club/v1",
  issuer: DOMAIN.endsWith("/") ? DOMAIN : `${DOMAIN}/`,
  callbackUrl: `${BASE_URL}/api/auth/callback`,
  logoutUrl: `${BASE_URL}/login`,
  allowedOrigins: [
    BASE_URL,
    "https://velora.club",
    "https://api.velora.club",
  ],
  socialConnections: {
    google: "google-oauth2",
    apple: "apple",
    facebook: "facebook",
  },
};
