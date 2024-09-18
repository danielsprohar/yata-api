import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AUTH_TYPE_JWT } from './guards/jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: AUTH_TYPE_JWT,
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}
