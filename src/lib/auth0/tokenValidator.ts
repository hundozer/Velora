

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

export class JwtValidatorService {
  public static async validateAuth0Token(authHeader: string | undefined): Promise<JwtValidationResult> {
    if (!authHeader?.startsWith("Bearer ")) {
      return { isValid: false, statusCode: 401, message: "Missing or invalid Authorization header" };
    }
    return { isValid: false, statusCode: 401, message: "Bearer token validation is not configured" };
  }
}
