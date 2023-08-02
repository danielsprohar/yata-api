import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ActiveUser } from '../decorators';
import { COOKIE_REFRESH_TOKEN_KEY } from '../iam.constants';
import { AuthenticationService } from './authentication.service';
import { Auth, Public } from './decorators';
import { SignInDto, SignUpDto } from './dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthType } from './enums';
import { authCookieOptions } from '../iam.constants';
import { Cookies } from '../../decorators/cookies.decorator';

@ApiTags('Authentication')
@Public()
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('logout')
  @Auth(AuthType.BEARER)
  @HttpCode(HttpStatus.OK)
  async logout(
    @ActiveUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    res.clearCookie(COOKIE_REFRESH_TOKEN_KEY, authCookieOptions);
    return HttpStatus.OK;
  }

  @Post('refresh-tokens')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Cookies(COOKIE_REFRESH_TOKEN_KEY) refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('No token');
    }

    const authServiceRes = await this.authService.refreshTokens(refreshToken);

    res.clearCookie(COOKIE_REFRESH_TOKEN_KEY, authCookieOptions);
    res.cookie(
      COOKIE_REFRESH_TOKEN_KEY,
      authServiceRes.refreshToken,
      authCookieOptions,
    );

    return {
      accessToken: authServiceRes.accessToken,
      user: authServiceRes.user,
    } as AuthResponseDto;
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  async signUp(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SignUpDto,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.signUp(
      dto,
    );

    res.cookie(COOKIE_REFRESH_TOKEN_KEY, refreshToken, authCookieOptions);

    return { accessToken, user } as AuthResponseDto;
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SignInDto,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.signIn(
      dto,
    );

    res.cookie(COOKIE_REFRESH_TOKEN_KEY, refreshToken, authCookieOptions);

    return { accessToken, user } as AuthResponseDto;
  }
}
