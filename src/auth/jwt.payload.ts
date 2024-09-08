export interface JwtPayload {
  exp: number;
  iat: number;
  auth_time: number;
  jti?: string;
  iss: string;
  aud: string;
  sub: string;
  email: string;
  preferred_username: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
  realm_access: {
    roles: string[];
  };
  resource_access?: {
    account?: {
      roles: string[];
    };
  };
  [key: string]: any;
}
