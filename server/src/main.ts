import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    // CRITICAL FIX: Allow Frontend (Port 5173) to talk to Backend
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(5000);
  console.log(`🚀 Server running on: ${await app.getUrl()}`);
}
bootstrap();
