import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, PrismaClient],
})
export class AvailabilityModule {}