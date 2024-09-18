import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const AUTH_TYPE_JWT = 'jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard(AUTH_TYPE_JWT) {}
