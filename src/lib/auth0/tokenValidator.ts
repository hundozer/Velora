import { createRemoteJWKSet, jwtVerify } from "jose";
import { AUTH0_CONFIG } from "./config";

export interface Auth0TokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  [key: string]: unknown;
}

export interface JwtValidationResult {
  isValid: boolean;
  statusCode: number;
  message: string;
  payload?: Auth0TokenPayload;
}

const jwks = createRemoteJWKSet(new URL(".well-known/jwks.json", AUTH0_CONFIG.issuer));

export class JwtValidatorService {
  public static async validateAuth0Token(authHeader: string | undefined): Promise<JwtValidationResult> {
    if (!authHeader?.startsWith("Bearer ")) {
      return { isValid: false, statusCode: 401, message: "Missing or invalid Authorization header" };
    }
    const token = authHeader.slice(7).trim();
    if (!token || !AUTH0_CONFIG.audience) {
      return { isValid: false, statusCode: 401, message: "Bearer token validation is not configured" };
    }

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: AUTH0_CONFIG.issuer,
        audience: AUTH0_CONFIG.audience,
        algorithms: ["RS256"],
      });
      if (typeof payload.sub !== "string" || !payload.sub) {
        return { isValid: false, statusCode: 401, message: "Token subject is missing" };
      }
      return { isValid: true, statusCode: 200, message: "Auth0 bearer token verified", payload: payload as Auth0TokenPayload };
    } catch {
      return { isValid: false, statusCode: 401, message: "Bearer token validation failed" };
    }
  }
}
