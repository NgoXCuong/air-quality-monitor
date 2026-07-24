import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Air Quality Monitoring API')
    .setDescription(
      'API cho hệ thống giám sát chất lượng không khí, thời tiết và cảnh báo sức khỏe',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);

  console.log(`==============================================================================`);
  Logger.log(`🚀 Server: http://localhost:${port}/api/v1`);
  Logger.log(`📖 Swagger: http://localhost:${port}/docs`);
  console.log(`==============================================================================`);
}

bootstrap();