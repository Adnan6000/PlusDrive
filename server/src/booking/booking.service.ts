import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingService {
  private prisma = new PrismaClient();
  constructor(private readonly notif: NotificationService, 
  private readonly notificationService: NotificationService) {}

  // --- INVOICE METHODS ---

 async generateInvoice(data: { studentId: string, amount: number, dueDate: string, description: string }) {
  if (data.studentId === 'ALL') {
    const allStudents = await this.prisma.user.findMany({ where: { role: 'STUDENT' } });
    const results: any[] = [];
    
    // Use a sequential loop to ensure each invoice gets a unique number
    for (const student of allStudents) {
      const uniqueSuffix = Date.now().toString().slice(-4); // Use last 4 digits of timestamp
      const count = await this.prisma.invoice.count();
      const invoiceNo = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}-${uniqueSuffix}`;
      
      const inv = await this.prisma.invoice.create({
        data: {
          invoiceNo,
          studentId: student.id,
          amount: data.amount,
          dueDate: new Date(data.dueDate),
          description: data.description,
          status: 'PENDING'
        }
      });
      results.push(inv);
    }
    return { message: `${results.length} invoices generated successfully.` };
  }

  // Logic for a Single Specific Student
  const uniqueSuffix = Date.now().toString().slice(-4);
  const count = await this.prisma.invoice.count();
  const invoiceNo = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}-${uniqueSuffix}`;

  return this.prisma.invoice.create({
    data: {
      invoiceNo,
      studentId: data.studentId,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      description: data.description,
      status: 'PENDING'
    },
    include: { student: true }
  });
}

  // ✅ ADDED: This fixes the Controller error
  async processInvoicePayment(invoiceId: string, proofUrl: string) {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: 'REVIEWING',
        proofUrl: proofUrl 
      }
    });
  }

  async getStudentInvoices(studentId: string) {
    return this.prisma.invoice.findMany({
      where: { studentId: studentId },
      include: { student: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllInvoices() {
    return this.prisma.invoice.findMany({
      include: { student: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateInvoiceStatus(invoiceId: string, status: 'PAID' | 'REJECTED', note?: string) {
    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: status, // Update to PAID or REJECTED
        instructorNote: note || '' 
      },
      include: { student: true }
    });

    // Notify student of the final status
    if (updated.student?.email) {
      await this.notif.sendEmail(
        updated.student.email,
        `Invoice ${updated.invoiceNo} - ${status}`,
        `Your payment proof has been ${status.toLowerCase()} by the instructor.`
      );
    }

    return updated;
  }

  // --- RESTORED CORE BOOKING METHODS ---

  async createBookingRequest(
    studentId: string, 
    availabilityId: string, 
    type: string, 
    note?: string,
    reqLocation?: string,
    reqLat?: number,
    reqLng?: number
) {
    // 1. Fetch the slot and include instructor details to check for autoConfirm
    const slot = await this.prisma.availability.findUnique({ 
        where: { id: availabilityId }, 
        include: { admin: true } 
    });

    if (!slot || slot.isBooked) {
        throw new BadRequestException('Slot unavailable');
    }

    // 2. Create the booking with all pickup location details
    const booking = await this.prisma.booking.create({
        data: { 
            studentId, 
            adminId: slot.adminId, 
            availabilityId, 
            date: slot.date, 
            startTime: slot.startTime, 
            endTime: slot.endTime, 
            type, 
            // Logic: Set status based on instructor settings
            status: slot.admin?.autoConfirm ? 'CONFIRMED' : 'PENDING', 
            studentNote: note || '', // Maps 'note' from frontend to studentNote in DB
            
            // ✅ PICKUP LOCATION FIELDS
            reqLocation: reqLocation || null,
            reqLat: reqLat ? parseFloat(reqLat.toString()) : null,
            reqLng: reqLng ? parseFloat(reqLng.toString()) : null,
            
            // Logic: Automatically set status to PENDING if a location is provided
            PickupStatus: reqLocation ? 'PENDING' : 'NONE' 
        },
        include: { student: true, admin: true }
    });

    // 3. Mark the slot as booked so it disappears from the available list
    await this.prisma.availability.update({ 
        where: { id: availabilityId }, 
        data: { isBooked: true } 
    });

    return booking;
}

  async respondToBooking(bookingId: string, action: 'CONFIRMED' | 'REJECTED') {
      // 1. Find the booking and include student details for the notification
      const booking = await this.prisma.booking.findUnique({ 
          where: { id: bookingId },
          include: { student: true } 
      });

      if (!booking) throw new NotFoundException('Booking not found');

      // 2. Logic: If rejected, release the availability slot immediately
      if (action === 'REJECTED') {
          await this.prisma.availability.update({ 
              where: { id: booking.availabilityId }, 
              data: { isBooked: false } 
          });
      }

      // 3. Update the booking status and capture the result in 'updated'
      const updated = await this.prisma.booking.update({ 
          where: { id: bookingId }, 
          data: { status: action }, 
          include: { student: true } 
      });

      // 4. Send Automated Message to Inbox
      const messageText = action === 'CONFIRMED' 
          ? `✅ Your lesson for ${new Date(updated.date).toLocaleDateString()} at ${updated.startTime} has been CONFIRMED.`
          : `❌ Your lesson request for ${new Date(updated.date).toLocaleDateString()} was REJECTED. The slot is now open for re-booking.`;

      await this.createAutomatedMessage(updated.adminId, updated.studentId, messageText);

      // 5. Finally Return
      return updated;
  }

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    // Logic: Define accurate time boundaries for today
    const todayStart = new Date(); 
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); 
    todayEnd.setHours(23, 59, 59, 999);

    if (user?.role === 'STUDENT') {
        // Count bookings waiting for Instructor approval
        const pending = await this.prisma.booking.count({ 
            where: { studentId: userId, status: 'PENDING' } 
        });

        // Count confirmed lessons happening today or in the future
        const upcoming = await this.prisma.booking.count({ 
            where: { studentId: userId, status: 'CONFIRMED', date: { gte: todayStart } } 
        });

        // Count confirmed lessons that have already passed
        const completed = await this.prisma.booking.count({ 
            where: { studentId: userId, status: 'CONFIRMED', date: { lt: todayStart } } 
        });

        return { 
            title1: 'Pending Requests', val1: pending, 
            title2: 'Upcoming Lessons', val2: upcoming, 
            title3: 'Completed Lessons', val3: completed 
        };
    } else {
        // ✅ NEW: Count pickup requests specifically waiting for Instructor decision
        const pickupAction = await this.prisma.booking.count({ 
            where: { adminId: userId, PickupStatus: 'PENDING' } 
        });

        // Count confirmed lessons scheduled specifically for today
        const todayLessons = await this.prisma.booking.count({ 
            where: { adminId: userId, status: 'CONFIRMED', date: { gte: todayStart, lte: todayEnd } } 
        });

        // Count unique students this instructor has interacted with
        const totalStudents = await this.prisma.booking.groupBy({
            by: ['studentId'],
            where: { adminId: userId }
        });

        return { 
            title1: 'Pickup Requests', val1: pickupAction, // Updated label
            title2: 'Lessons Today', val2: todayLessons, 
            title3: 'Total Students', val3: totalStudents.length 
        };
    }
}

  async updateSchoolFinance(schoolId: string, data: { bankRegNum: string, bankAccountNum: string }) {
    return this.prisma.school.update({ where: { id: schoolId }, data });
  }

  async getPendingRequests(adminId: string) { return this.prisma.booking.findMany({ where: { adminId, status: 'PENDING' }, include: { student: true } }); }
  async getStudentBookings(studentId: string) { return this.prisma.booking.findMany({ where: { studentId }, include: { admin: { include: { school: true } } } }); }
  async getAllBookings(userId: string) { return this.prisma.booking.findMany({ where: { OR: [{ studentId: userId }, { adminId: userId }], status: 'CONFIRMED' }, include: { student: true, admin: true } }); }

  // Additional methods for pickup location management, payment proof handling, etc. can be added here

  async updatePickupRequest(bookingId: string, userId: string, data: { location: string, lat: number, lng: number, note: string }) {
    // Check if booking exists
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // Rule: Student can only edit if status is PENDING or NONE
    if (booking.PickupStatus !== 'PENDING' && booking.PickupStatus !== 'NONE') {
      throw new BadRequestException('Location cannot be changed after instructor decision');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        reqLocation: data.location,
        reqLat: data.lat,
        reqLng: data.lng,
        studentNote: data.note,
        PickupStatus: 'PENDING',
        reqAt: new Date(), // Audit timestamp
      },
    });
  }

  async createAutomatedMessage(senderId: string, receiverId: string, content: string) {
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        isRead: false
      }
    });
  }

  async respondToPickup(bookingId: string, instructorId: string, action: 'ACCEPT' | 'REJECTED', body: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId }, // ✅ Matches argument
      include: { student: true, admin: true }
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // ✅ Fix: Use 'ACCEPTED' to match your Prisma Enum schema
    const finalStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId }, // ✅ FIX: Use the 'bookingId' parameter directly
      data: {
        PickupStatus: finalStatus,
        instructorNote: body.note || "",
        // ✅ Logic: If accepted, use student's request; if changed, use instructor's body data
        finalLocation: action === 'ACCEPT' ? booking.reqLocation : body.location,
        finalLat: action === 'ACCEPT' ? booking.reqLat : (body.lat ? parseFloat(body.lat.toString()) : null),
        finalLng: action === 'ACCEPT' ? booking.reqLng : (body.lng ? parseFloat(body.lng.toString()) : null),
        decidedAt: new Date()
      }
    });

    // ✅ Notification Logic
    const statusText = action === 'ACCEPT' ? 'confirmed' : 'proposed a new';
    const msg = `Instructor ${booking.admin.fullName} has ${statusText} your pickup location for the lesson on ${new Date(booking.date).toLocaleDateString()}.`;
    
    await this.notificationService.createNotification(
      booking.studentId, 
      msg, 
      'PICKUP_UPDATE'
    );

    return updatedBooking;
  }
}