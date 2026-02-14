import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessageService {
  private prisma = new PrismaClient();

  constructor(private readonly notif: NotificationService) {}

  // 1. SEND MESSAGE
  async sendMessage(senderId: string, receiverId: string, content: string, isChat: boolean = false) {
    const message = await this.prisma.message.create({
      data: { senderId, receiverId, content, isRead: false }
    });

    // Email Notification Logic (No Spam)
    if (!isChat) {
       const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
       const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });

       if (receiver?.email && sender) {
          await this.notif.sendEmail(
            receiver.email,
            `New Message from ${sender.fullName}`,
            `Hello ${receiver.fullName},\n\n${sender.fullName} sent you a message:\n\n"${content}"\n\nLog in to PlusDrive to reply.`
          );
       }
    }
    return message;
  }

  // 2. GET CONVERSATION (Now Handles "Seen" Status)
  async getMessages(currentUser: string, otherUser: string) {
    // A. Mark messages sent BY the other user TO me as "Read"
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUser,
        receiverId: currentUser,
        isRead: false
      },
      data: { isRead: true }
    });

    // B. Return the history
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser, receiverId: otherUser },
          { senderId: otherUser, receiverId: currentUser }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // 3. GET CONTACTS (Now Includes Email)
  async getContacts(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        OR: [{ studentId: userId }, { adminId: userId }]
      },
      include: { student: true, admin: true }
    });

    const contacts = new Map();

    bookings.forEach(b => {
      const otherUser = b.studentId === userId ? b.admin : b.student;
      if (!contacts.has(otherUser.id)) {
        contacts.set(otherUser.id, {
          id: otherUser.id,
          name: otherUser.fullName, 
          email: otherUser.email, // ✅ ADDED EMAIL HERE
          role: otherUser.role,
          lastMsg: "Click to chat",
          date: b.createdAt
        });
      }
    });

    return Array.from(contacts.values());
  }
}