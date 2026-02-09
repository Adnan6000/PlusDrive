import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ IMPROVED: Robust CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      // List of allowed static domains
      const allowedOrigins = [
        'https://plus-drive-f5p7.vercel.app', // Your Live Frontend
        'http://localhost:5173',               // Local development
        'http://localhost:3000',
      ];

      // Allow if origin is in the list, is a Vercel preview, or is local (no origin)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization', // Explicitly allow these
  });

  // Use the PORT from Vercel or default to 5000
  await app.listen(process.env.PORT || 5000);
}
bootstrap();