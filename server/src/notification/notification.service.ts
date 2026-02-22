import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
// ✅ FIXED PATH: Using a direct relative path to ensure resolution
import { PrismaService } from './../prisma/prisma.service';
@Injectable()
export class NotificationService {
  private transporter;
  private readonly clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  constructor(private readonly prisma: PrismaService) {
    // Uses credentials from .env
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // e.g. fazalmohammad333@gmail.com
        pass: process.env.EMAIL_PASS, // Your App Password
      },
    });
  }

  // Helper: Generate Google Calendar Link for Email
  private generateCalendarLink(title: string, date: string, startTime: string) {
    const start = new Date(date);
    const [h, m] = startTime.split(':');
    start.setHours(parseInt(h), parseInt(m));
    
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=Driving+Lesson&location=Driving+School&sf=true&output=xml`;
  }

  // ✅ Send generic email using Nodemailer
  public async sendEmail(to: string, subject: string, body: string) {
    const mailOptions = {
      from: `"DriveBook" <${process.env.EMAIL_USER?.toLowerCase()}>`,
      to: to.toLowerCase(),
      subject: subject,
      text: body,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`📨 [EMAIL SENT] To: ${to.toLowerCase()}`);
    } catch (error) {
      console.error(`❌ [EMAIL FAILED] To: ${to}`, error);
    }
  }

  // ==========================================================
  // 1. AUTHENTICATION LOGICS
  // ==========================================================

  async sendVerificationEmail(email: string, token: string) {
    const link = `${this.clientUrl}/verify-email?token=${token}`;
    await this.sendEmail(
      email, 
      "Verify Account", 
      `Welcome to DriveBook! \n\nPlease click the link below to verify your account:\n${link}`
    );
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const link = `${this.clientUrl}/reset-password?token=${token}`;
    await this.sendEmail(
      email, 
      "Reset Password", 
      `Click here to reset your password:\n${link}`
    );
  }

  // ==========================================================
  // 2. BOOKING & PICKUP LOGICS
  // ==========================================================

  async notifyInstructorBooking(email: string, studentName: string, date: string, time: string) {
    await this.sendEmail(
      email, 
      `New Booking Request: ${studentName}`, 
      `Student ${studentName} wants to book ${new Date(date).toDateString()} at ${time}. Log in to approve.`
    );
  }

  async notifyBookingStatus(email: string, status: 'CONFIRMED' | 'REJECTED', date: string, startTime?: string) {
    if (status === 'CONFIRMED' && startTime) {
      const link = this.generateCalendarLink("Driving Lesson", date, startTime);
      await this.sendEmail(
        email, 
        "Booking Confirmed ✅", 
        `Your lesson on ${new Date(date).toDateString()} at ${startTime} is CONFIRMED.\n\n👉 Add to Google Calendar: ${link}`
      );
    } else {
      await this.sendEmail(
        email, 
        "Booking Rejected ❌", 
        `Your booking request for ${new Date(date).toDateString()} was rejected.`
      );
    }
  }

  async notifyPickupUpdate(email: string, studentName: string, status: string, location: string, note?: string) {
    const message = `Hello ${studentName},\n\nYour pickup request has been ${status}.\nFinal Pickup Location: ${location}\n${note ? `Instructor Note: ${note}` : ''}\n\nBest regards,\nDriveBook Team`;
    await this.sendEmail(email, `Pickup Location Update: ${status}`, message);
  }

  async notifyPaymentProof(instructorEmail: string, studentName: string, bookingDate: string) {
    await this.sendEmail(
      instructorEmail,
      "New Payment Proof Received 💰",
      `Student ${studentName} has uploaded payment proof for the lesson on ${new Date(bookingDate).toDateString()}. Please log in to the Finance Dashboard to verify.`
    );
  }

  // ==========================================================
  // 3. SYSTEM NOTIFICATION LOGICS
  // ==========================================================

  async createNotification(userId: string, message: string, type: string) {
    // 1. Save to Database for the bell icon
    const notif = await this.prisma.notification.create({
      data: { userId, message, type, isRead: false }
    });

    // 2. Logic: Simultaneously Trigger Email
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
       // Integration: Using the internal sendEmail method to ensure delivery
       await this.sendEmail(user.email, `DriveBook Alert: ${type}`, message);
    }
    
    return notif;
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20 
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }
}