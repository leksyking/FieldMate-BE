import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('FieldMate API')
    .setDescription(
      'Real-time soil suitability assessment for Nigerian smallholder farmers. Uses FAO-based fuzzy logic and Claude AI recommendations.',
    )
    .setVersion('1.0.0')
    .addTag('Assessment', 'Soil suitability evaluation endpoints')
    .addTag('Health', 'Service health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`FieldMate API listening on http://localhost:${port}/api`);
  console.log(`Swagger UI available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
});
