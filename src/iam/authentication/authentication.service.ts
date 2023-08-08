import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { randomUUID } from 'crypto';
import { PrismaClientErrorCode } from '../../prisma/enums/prisma-client-error-code.enum';
import { TaskView } from '../../users/enums';
import { UsersService } from '../../users/users.service';
import { ActiveUserData } from '../active-user-data';
import jwtConfig from '../config/jwt.config';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto, SignUpDto } from './dto';
import { InvalidatedRefreshTokenError } from './errors';
import { RefreshTokenPayload } from './interfaces';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async logout(userId: string): Promise<void> {
    await this.refreshTokenIdsStorage.invalidate(userId);
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    try {
      const tokenPayload =
        await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
          secret: this.jwtConfiguration.secret,
          audience: this.jwtConfiguration.audience,
          issuer: this.jwtConfiguration.issuer,
        });

      const user = await this.usersService.findOne({
        where: {
          id: tokenPayload.sub,
        },
        select: {
          id: true,
          email: true,
          username: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        tokenPayload.refreshTokenId,
      );

      if (isValid) {
        // refresh token rotation -> ensure that this token cannot be used again.
        await this.refreshTokenIdsStorage.invalidate(user.id);
      } else {
        throw new InvalidatedRefreshTokenError('Refresh token is invalid');
      }

      const tokens = await this.generateTokens(user);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
      };
    } catch (error) {
      if (error instanceof InvalidatedRefreshTokenError) {
        console.error(error);
      }
      throw new UnauthorizedException();
    }
  }

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    try {
      const user = await this.usersService.create({
        data: {
          email: signUpDto.email,
          password: await this.hashingService.hash(signUpDto.password),
          preferences: {
            taskView: TaskView.MINIMALIST,
          },
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      const { accessToken, refreshToken } = await this.generateTokens(
        user as User,
      );

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === PrismaClientErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
          throw new UnauthorizedException('Email already exists');
        }
      }
      throw err;
    }
  }

  async signIn(
    signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await this.usersService.findOne({
      where: {
        email: signInDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );

    if (!isEqual) {
      throw new UnauthorizedException('Invalid credentials');
    }

    delete user.password;
    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenId = randomUUID();

    // create tokens in parallel
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email },
      ),
      this.signToken<Partial<RefreshTokenPayload>>(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        { refreshTokenId },
      ),
    ]);

    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);

    return { accessToken, refreshToken };
  }

  private async signToken<T>(
    userId: string,
    expiresIn: number,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
