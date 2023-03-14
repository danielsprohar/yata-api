import { registerAs } from '@nestjs/config';

/**
 * Creates the `jwt` config namespace.
 */
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  audience: process.env.JWT_TOKEN_AUDIENCE,
  issuer: process.env.JWT_TOKEN_ISSUER,
  accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL,
  refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL,
}));
