import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  private prisma = new PrismaClient();
  constructor(private readonly notif: NotificationService) {}

  // ==========================================================
  // 1. CREATE REQUEST (With Auto-Confirm Check)
  // ==========================================================
  async createBookingRequest(studentId: string, availabilityId: string, type: string, note?: string) {
    // 1. Fetch Slot AND Instructor (to check autoConfirm setting)
    const slot = await this.prisma.availability.findUnique({ 
      where: { id: availabilityId },
      include: { admin: true } 
    });
    
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.isBooked) throw new BadRequestException('Slot already booked');

    // 2. CHECK INSTRUCTOR PREFERENCE
    // If autoConfirm is TRUE, status is CONFIRMED. Else PENDING.
    // (Safety check: ensure slot.admin exists)
    const isAuto = slot.admin?.autoConfirm === true;
    const initialStatus = isAuto ? 'CONFIRMED' : 'PENDING';

    // 3. Create Booking
    const booking = await this.prisma.booking.create({
      data: {
        studentId,
        adminId: slot.adminId,
        availabilityId: availabilityId, // ✅ Linked correctly
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type,
        status: initialStatus,
        note: note || '',
      },
      include: { student: true, admin: true } // ✅ Fetches details for email
    });

    // 4. Lock the slot immediately
    await this.prisma.availability.update({
      where: { id: availabilityId },
      data: { isBooked: true }
    });

    // 5. Send Notifications
    if (initialStatus === 'CONFIRMED') {
        // Notify Student: "You are booked!"
        if (booking.student?.email) {
          await this.notif.notifyBookingStatus(booking.student.email, 'CONFIRMED', slot.date.toString(), slot.startTime);
        }
        // Notify Instructor: "New Auto-Booking"
        if (booking.admin?.email) {
          await this.notif.notifyInstructorBooking(booking.admin.email, booking.student.fullName, slot.date.toString(), slot.startTime); 
        }
    } else {
        // Manual Flow: Notify Instructor to Approve
        if (booking.admin?.email) {
          await this.notif.notifyInstructorBooking(booking.admin.email, booking.student.fullName, slot.date.toString(), slot.startTime);
        }
    }

    return booking;
  }

  // ==========================================================
  // 2. RESPOND TO REQUEST (Accept / Reject)
  // ==========================================================
  async respondToBooking(bookingId: string, action: 'CONFIRMED' | 'REJECTED') {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (action === 'REJECTED') {
      // ✅ CRITICAL: If rejected, we must OPEN the slot again!
      await this.prisma.availability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false }
      });
    }

    // Update Booking Status
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: action },
      include: { student: true }
    });

    // Notify Student
    if (updated.student?.email) {
      await this.notif.notifyBookingStatus(
        updated.student.email, 
        action, 
        updated.date.toString(), 
        updated.startTime
      );
    }

    return updated;
  }

  // ==========================================================
  // 3. DASHBOARD STATS (For Charts)
  // ==========================================================
  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { title1: 'Error', val1: 0, title2: 'Error', val2: 0, title3: 'Error', val3: 0 };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (user.role === 'STUDENT') {
      // STUDENT STATS
      const pending = await this.prisma.booking.count({
        where: { studentId: userId, status: 'PENDING' }
      });
      const upcoming = await this.prisma.booking.count({
        where: { 
          studentId: userId, 
          status: 'CONFIRMED',
          date: { gte: new Date() } 
        }
      });
      const completed = await this.prisma.booking.count({
        where: { studentId: userId, status: 'CONFIRMED', date: { lt: new Date() } }
      });
      return { title1: 'Pending Requests', val1: pending, title2: 'Upcoming Lessons', val2: upcoming, title3: 'Completed', val3: completed };
    } else {
      // INSTRUCTOR STATS
      const pending = await this.prisma.booking.count({
        where: { adminId: userId, status: 'PENDING' }
      });
      const todayLessons = await this.prisma.booking.count({
        where: { 
          adminId: userId, 
          status: 'CONFIRMED',
          date: { gte: todayStart, lte: todayEnd }
        }
      });
      // Count distinct students this instructor has taught (Better than counting ALL students in DB)
      const uniqueStudents = await this.prisma.booking.groupBy({
        by: ['studentId'],
        where: { adminId: userId },
      });
      
      return { title1: 'Action Required', val1: pending, title2: 'Lessons Today', val2: todayLessons, title3: 'My Students', val3: uniqueStudents.length };
    }
  }

  // ==========================================================
  // 4. GETTERS
  // ==========================================================
  async getPendingRequests(adminId: string) {
    return this.prisma.booking.findMany({
      where: { adminId, status: 'PENDING' },
      include: { student: true },
      orderBy: { date: 'asc' }
    });
  }

  async getStudentBookings(studentId: string) {
    return this.prisma.booking.findMany({
      where: { studentId },
      include: { admin: true },
      orderBy: { date: 'desc' }
    });
  }
  
  async getAllBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { 
        OR: [{ studentId: userId }, { adminId: userId }],
        status: 'CONFIRMED'
      },
      include: { student: true, admin: true },
      orderBy: { date: 'asc' }
    });
  }
}