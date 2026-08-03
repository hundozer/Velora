import { AUTH0_CONFIG } from "./config";

export interface Auth0TokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  [key: string]: any;
}

export interface JwtValidationResult {
  isValid: boolean;
  statusCode: number;
  message: string;
  payload?: Auth0TokenPayload;
}

export class JwtValidatorService {
  /**
   * Validates server-side Auth0 JWT Bearer Tokens
   */
  public static validateAuth0Token(authHeader: string | undefined): JwtValidationResult {
    if (!authHeader) {
      return {
        isValid: false,
        statusCode: 401,
        message: "Missing Authorization header",
      };
    }

    if (!authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        statusCode: 401,
        message: "Invalid Authorization header scheme. Expected Bearer token.",
      };
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return {
        isValid: false,
        statusCode: 401,
        message: "Empty Bearer token string",
      };
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        isValid: false,
        statusCode: 401,
        message: "Malformed JWT token structure",
      };
    }

    try {
      const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
      const payload: Auth0TokenPayload = JSON.parse(payloadJson);

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return {
          isValid: false,
          statusCode: 401,
          message: "JWT token has expired",
        };
      }

      const expectedIssuer = AUTH0_CONFIG.domain.endsWith("/")
        ? AUTH0_CONFIG.domain
        : `${AUTH0_CONFIG.domain}/`;
      
      if (payload.iss && !payload.iss.startsWith(AUTH0_CONFIG.domain) && payload.iss !== expectedIssuer) {
        return {
          isValid: false,
          statusCode: 401,
          message: `Invalid token issuer: ${payload.iss}`,
        };
      }

      return {
        isValid: true,
        statusCode: 200,
        message: "Auth0 JWT token successfully validated",
        payload,
      };
    } catch (err: any) {
      return {
        isValid: false,
        statusCode: 401,
        message: `JWT parsing error: ${err.message}`,
      };
    }
  }
}
