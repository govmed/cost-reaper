import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Versioned API (FR-12). Health/readiness stay at the root for probes.
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready'] });
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('cost-reaper API')
    .setDescription('Technology Project Cost Estimator REST API (FR-12).')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number.parseInt(process.env.API_PORT ?? '8000', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on http://0.0.0.0:${port}  (Swagger UI at /docs)`);
}

void bootstrap();
