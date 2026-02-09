import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ FIX: Enable CORS for your Vercel Frontend
  app.enableCors({
    origin: [
      'https://plus-drive-f5p7.vercel.app', // Your Live Frontend
      'http://localhost:5173',               // Your Local Laptop
      'http://localhost:3000'                // Backup Local
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Use the PORT from Vercel or default to 5000
  await app.listen(process.env.PORT || 5000);
}
bootstrap();