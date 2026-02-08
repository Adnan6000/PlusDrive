import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Services
import { AuthService } from './auth/auth.service';
import { BookingService } from './booking/booking.service';
import { AvailabilityService } from './availability/availability.service';
import { NotificationService } from './notification/notification.service';
import { LessonService } from './lesson/lesson.service';
import { MessageService } from './message/message.service';

// Controllers
import { AuthController } from './auth/auth.controller';
import { BookingController } from './booking/booking.controller';
import { AvailabilityController } from './availability/availability.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { LessonController } from './lesson/lesson.controller';
import { MessageController } from './message/message.controller';


@Module({
  imports: [
    JwtModule.register({
      secret: 'secretKey', // In production use .env
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    BookingController,
    AvailabilityController,
    DashboardController,
    MessageController,
    LessonController
  ],

  providers: [
    AppService, 
    AuthService, 
    BookingService, 
    AvailabilityService, 
    NotificationService,
    PrismaClient,
    LessonService,
    MessageService
  ],
})
export class AppModule {}