import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AvailabilityService {
  private prisma = new PrismaClient();

  // Add Slot (Prevent Duplicates)
  async addAvailability(adminId: string, date: Date, startTime: string, endTime: string) {
    const existing = await this.prisma.availability.findFirst({
      where: { adminId, date: date, startTime }
    });
    if (existing) throw new BadRequestException('Slot already exists');

    return this.prisma.availability.create({
      data: { adminId, date, startTime, endTime, isBooked: false }
    });
  }

  // Get Slots (For Grid)
  async getAvailability(adminId: string) {
    return this.prisma.availability.findMany({
      where: { adminId },
      orderBy: { startTime: 'asc' }
    });
  }

  // Remove Slot (Only if not booked)
  async removeAvailability(id: string) {
    const slot = await this.prisma.availability.findUnique({ where: { id } });
    if (slot?.isBooked) throw new BadRequestException("Cannot delete a booked slot");
    return this.prisma.availability.delete({ where: { id } });
  }
}