import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

function checkEnvironment(configService: ConfigService) {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_TOKEN_AUDIENCE',
    'JWT_TOKEN_ISSUER',
    'JWT_ACCESS_TOKEN_TTL',
    'JWT_REFRESH_TOKEN_TTL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'REDIS_USER',
    'PORT',
    'CLIENT_ORIGIN_URL',
    // Auth0
    // 'ISSUER_BASE_URL',
    // 'AUDIENCE',
    // Google oauth
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  requiredEnvVars.forEach((envVar) => {
    if (!configService.get<string>(envVar)) {
      throw Error(`Undefined environment variable: ${envVar}`);
    }
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  checkEnvironment(configService);
  // app.use(nocache());

  app.setGlobalPrefix('api');
  app.enableCors({
    credentials: true,
    origin: [
      configService.get<string>('CLIENT_ORIGIN_URL'),
      'http://localhost',
      'http://localhost:4200',
    ],
    methods: ['DELETE', 'GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip props that are not defined in the DTO class
      transform: true,
    }),
  );

  app.use(cookieParser());

  // https://www.npmjs.com/package/helmet
  app.use(
    helmet({
      hsts: { maxAge: 31536000 }, // 365 days (in seconds)
      frameguard: { action: 'deny' }, // https://en.wikipedia.org/wiki/Clickjacking
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'frame-ancestors': ["'none'"],
        },
      },
    }),
  );

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  const config = new DocumentBuilder()
    .setTitle('YATA')
    .setDescription('RESTful API for YATA')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(configService.get<string>('PORT'));
}
bootstrap();
