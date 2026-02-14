import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {

  // Helper: Generate Google Calendar Link for Email
  private generateCalendarLink(title: string, date: string, startTime: string) {
    const start = new Date(date);
    const [h, m] = startTime.split(':');
    start.setHours(parseInt(h), parseInt(m));
    
    // Default 1 hour duration
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=Driving+Lesson&location=Driving+School&sf=true&output=xml`;
  }

  // ✅ FIX: Change 'private' to 'public' so MessageService can use it
  public async sendEmail(to: string, subject: string, body: string) {
    console.log(`\n📨 [EMAIL SENT] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${body}\n`);
  }

  // SENDS A CLICKABLE LINK
  async sendVerificationEmail(email: string, token: string) {
    const link = `http://localhost:5173/verify-email?token=${token}`;
    
    await this.sendEmail(
      email, 
      "Verify Account", 
      `Welcome to DriveBook! \n\nPlease click the link below to verify your account:\n${link}`
    );
  }

  // UPDATED PASSWORD RESET TO SEND LINK
  async sendPasswordResetEmail(email: string, token: string) {
    const link = `http://localhost:5173/reset-password?token=${token}`;
    
    await this.sendEmail(
      email, 
      "Reset Password", 
      `Click here to reset your password:\n${link}`
    );
  }

  // 1. Notify Instructor of New Request
  async notifyInstructorBooking(email: string, studentName: string, date: string, time: string) {
    await this.sendEmail(
      email, 
      `New Booking Request: ${studentName}`, 
      `Student ${studentName} wants to book ${new Date(date).toDateString()} at ${time}. Log in to approve.`
    );
  }

  // 2. Notify Student of Confirmation
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
}