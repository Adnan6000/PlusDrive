import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  private prisma = new PrismaClient();
  constructor(private readonly notif: NotificationService) {}

  // 1. CREATE REQUEST (ALWAYS PENDING NOW)
  async createBookingRequest(studentId: string, availabilityId: string, type: string, note?: string) {
    // 1. Fetch Slot AND Instructor (to check autoConfirm setting)
    const slot = await this.prisma.availability.findUnique({ 
      where: { id: availabilityId },
      include: { admin: true } 
    });
    
    if (!slot) throw new BadRequestException('Slot not found');
    if (slot.isBooked) throw new BadRequestException('Slot already booked');

    // 2. CHECK INSTRUCTOR PREFERENCE
    // If autoConfirm is TRUE, status is CONFIRMED. Else PENDING.
    const initialStatus = slot.admin.autoConfirm ? 'CONFIRMED' : 'PENDING';

    // 3. Create Booking
    const booking = await this.prisma.booking.create({
      data: {
        studentId,
        adminId: slot.adminId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type,
        status: initialStatus, // <--- Dynamic Status
        note: note || '',
      },
      include: { student: true, admin: true }
    });

    // 4. Lock the slot
    await this.prisma.availability.update({
      where: { id: availabilityId },
      data: { isBooked: true }
    });

    // 5. Send Appropriate Notification
    if (initialStatus === 'CONFIRMED') {
        // Notify Student: "You are booked!"
        await this.notif.notifyBookingStatus(booking.student.email, 'CONFIRMED', slot.date.toString(), slot.startTime);
        // Notify Instructor: "New Auto-Booking"
        await this.notif.notifyInstructorBooking(booking.admin.email, booking.student.fullName, slot.date.toString(), slot.startTime); 
    } else {
        // Manual Flow: Notify Instructor to Approve
        await this.notif.notifyInstructorBooking(booking.admin.email, booking.student.fullName, slot.date.toString(), slot.startTime);
    }

    return booking;
}
  // 2. RESPOND (Accept/Reject)
  async respondToBooking(bookingId: string, action: 'CONFIRMED' | 'REJECTED') {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new BadRequestException('Booking not found');

    if (action === 'REJECTED') {
      // Free the slot logic
      await this.prisma.availability.updateMany({
        where: { adminId: booking.adminId, date: booking.date, startTime: booking.startTime },
        data: { isBooked: false }
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: action },
      include: { student: true }
    });

    // Notify Student (If Confirmed -> Send Calendar Link)
    await this.notif.notifyBookingStatus(
      updated.student.email, 
      action, 
      updated.date.toString(), 
      updated.startTime
    );

    return updated;
  }

  async getDashboardStats(userId: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { today: 0, pending: 0, total: 0 };

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
    const totalStudents = await this.prisma.user.count({
      where: { role: 'STUDENT' } // Simple count of all students for now
    });
    return { title1: 'Action Required', val1: pending, title2: 'Lessons Today', val2: todayLessons, title3: 'Total Students', val3: totalStudents };
  }
}

  // ... (Keep getPendingRequests, getStudentBookings, getAllBookings as they were)
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
      include: { student: true, admin: true }
    });
  }
}