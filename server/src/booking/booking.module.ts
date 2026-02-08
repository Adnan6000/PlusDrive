import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { NotificationService } from '../notification/notification.service';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [BookingController],
  providers: [BookingService, NotificationService, PrismaClient],
})
export class BookingModule {}
