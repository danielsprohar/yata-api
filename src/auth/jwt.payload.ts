export interface JwtPayload {
  exp: number;
  iat: number;
  jti?: string;
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  preferred_username?: string;
  email_verified?: boolean;
  resource_access?: {
    account?: {
      roles: string[];
    };
  };
  [key: string]: any;
}
