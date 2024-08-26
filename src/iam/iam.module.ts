import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { AccessTokenGuard, AuthenticationGuard } from './authentication/guards';
import jwtConfig from './config/jwt.config';
import { ArgonService } from './hashing/argon.service';
import { HashingService } from './hashing/hashing.service';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: ArgonService,
    },
    AuthenticationGuard,
    AccessTokenGuard,
    RedisService,
  ],
  exports: [AccessTokenGuard, AuthenticationGuard],
})
export class IamModule {}
