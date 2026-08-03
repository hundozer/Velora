import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Server-side Auth0 SDK client instance initialized with environment variables
 */
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "").replace("/", "") || "simpleafiedeu.eu.auth0.com",
  clientId: process.env.AUTH0_CLIENT_ID || "2wfjGUy76NmH8rdoxXxqg8CrbchkutTl",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "6Otyzf0BIT5lVEDqWiiwate1kAPlXMHV8N4Eq8iBJ3tmF5vBi7VkxydX9brkdd6D",
  secret: process.env.AUTH0_SECRET || "velora_long_session_secret_cookie_key_32bytes!",
  appBaseUrl: process.env.AUTH0_BASE_URL || "http://localhost:3000",
});
