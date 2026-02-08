import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MessageService {
  private prisma = new PrismaClient();

  // 1. SEND MESSAGE
  async sendMessage(senderId: string, receiverId: string, content: string) {
    return this.prisma.message.create({
      data: { senderId, receiverId, content }
    });
  }

  // 2. GET CHAT HISTORY (Between two users)
  async getMessages(user1: string, user2: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1, receiverId: user2 },
          { senderId: user2, receiverId: user1 }
        ]
      },
      orderBy: { createdAt: 'asc' } // Oldest first (like a chat)
    });
  }

  // 3. GET CONTACT LIST (People you have talked to OR have bookings with)
  async getContacts(userId: string) {
    // Strategy: Get everyone involved in a Booking with this user
    // This is the safest way to "connect" students and instructors
    const bookings = await this.prisma.booking.findMany({
      where: {
        OR: [{ studentId: userId }, { adminId: userId }]
      },
      include: { student: true, admin: true }
    });

    const contacts = new Map();

    bookings.forEach(b => {
      // If I am the student, add the admin. If I am the admin, add the student.
      const otherUser = b.studentId === userId ? b.admin : b.student;
      if (!contacts.has(otherUser.id)) {
        contacts.set(otherUser.id, {
          id: otherUser.id,
          fullName: otherUser.fullName,
          role: otherUser.role,
          lastMessage: "Click to start chatting" // You can enhance this later
        });
      }
    });

    return Array.from(contacts.values());
  }
}