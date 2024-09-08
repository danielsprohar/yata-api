import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.payload';
import { User } from './model/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: process.env.OAUTH2_JWKS_URI,
      }),
    });
  }

  async validate(payload: JwtPayload) {
    // TODO: Validate token
    // 1. Check exp
    // 2. Check sub (does user exists)
    const user: User = {
      id: payload.sub,
      username: payload.preferred_username,
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      emailVerified: payload.email_verified,
      roles: payload.realm_access.roles,
    };

    return user;
  }
}
