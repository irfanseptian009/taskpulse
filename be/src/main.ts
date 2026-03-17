import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://frontend:3000',
    'https://taskpluseglory.netlify.app',
    'https://taskpluseglory-fe.netlify.app',
  ];

  const configuredOrigins = configService
    .get<string>('CORS_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(
    new Set([...(defaultAllowedOrigins ?? []), ...(configuredOrigins ?? [])]),
  );

  const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

  const isAllowedOrigin = (origin?: string) => {
    if (!origin) return true;

    const normalized = normalizeOrigin(origin);
    const byList = allowedOrigins.some(
      (item) => normalizeOrigin(item) === normalized,
    );

    if (byList) return true;

    // Allow all Netlify preview/production domains if needed
    if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(normalized)) {
      return true;
    }

    return false;
  };

  // Enable CORS for frontend
  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global API prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 4000;

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 TaskPulse Backend running on http://localhost:${port}`);
}
bootstrap();
