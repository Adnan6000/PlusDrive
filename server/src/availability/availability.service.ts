import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AvailabilityService {
  private prisma = new PrismaClient();

  // Add Slot (Prevent Duplicates)
  async addAvailability(adminId: string, dateStr: string, startTime: string, endTime: string) {
  // 1. Convert the string to a midnight-aligned date to avoid overlap bugs
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    // 2. Check for existing slot with exact same parameters
    const existing = await this.prisma.availability.findFirst({
      where: {
        adminId,
        date: targetDate,
        startTime,
        endTime
      }
    });

    if (existing) {
      throw new BadRequestException('Slot already exists for this time.');
    }

    return this.prisma.availability.create({
      data: {
        adminId,
        date: targetDate,
        startTime,
        endTime,
        isBooked: false
      }
    });
  }

  // ✅ UPDATED: Get Slots (Include Booking Details)
  async getAvailability(adminId: string) {
    return this.prisma.availability.findMany({
      where: { adminId },
      // 👇 THIS IS THE MISSING PART
      include: { 
        booking: true // This fetches the connected Booking + Student ID
      }, 
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