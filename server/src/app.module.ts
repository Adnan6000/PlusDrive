import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Services
import { AuthService } from './auth/auth.service';
import { BookingService } from './booking/booking.service';
import { AvailabilityService } from './availability/availability.service';
import { NotificationService } from './notification/notification.service';
import { LessonService } from './lesson/lesson.service';
import { MessageService } from './message/message.service';
import { CloudinaryService } from './common/cloudinary.service';
import { PrismaService } from './prisma/prisma.service'; // ✅ Corrected reference

// Controllers
import { AuthController } from './auth/auth.controller';
import { BookingController } from './booking/booking.controller';
import { AvailabilityController } from './availability/availability.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { LessonController } from './lesson/lesson.controller';
import { MessageController } from './message/message.controller';
import { NotificationController } from './notification/notification.controller'; // ✅ Added

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey', 
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
    LessonController,
    NotificationController // ✅ Successfully Registered
  ],
  providers: [
    AppService, 
    AuthService, 
    BookingService, 
    AvailabilityService, 
    NotificationService,
    PrismaClient,
    LessonService,
    MessageService,
    CloudinaryService, 
    PrismaService // ✅ Provided globally to fix UnknownDependenciesException
  ],
  exports: [PrismaService],
})
export class AppModule {}