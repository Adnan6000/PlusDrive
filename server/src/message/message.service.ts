import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessageService {
  private prisma = new PrismaClient();
  constructor(private readonly notif: NotificationService) {}

  // ==========================================================
  // 1. SEND TEXT MESSAGE
  // ==========================================================
  async sendMessage(senderId: string, receiverId: string, content: string, isChat: boolean = false) {
    // A. Save Message
    const message = await this.prisma.message.create({
      data: { senderId, receiverId, content, isRead: false }
    });

    // B. Send Email Notification (ONLY if NOT a live chat)
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

  // ==========================================================
  // 2. SEND ATTACHMENT
  // ==========================================================
  async sendMessageWithAttachment(senderId: string, receiverId: string, url: string, type: string) {
    // Note: We usually don't send emails for attachments to avoid spam, 
    // but you can add the same logic here if you want.
    return this.prisma.message.create({
      data: { 
        senderId, 
        receiverId, 
        attachmentUrl: url, 
        attachmentType: type,
        content: type === 'IMAGE' ? 'Sent a photo' : 'Sent a file', // Fallback text
        isRead: false 
      }
    });
  }

  // ==========================================================
  // 3. DELETE MESSAGE (NEW LOGIC)
  // ==========================================================
  async deleteMessage(messageId: string, userId: string, deleteForEveryone: boolean) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new Error("Message not found");

    // Case A: Delete for EVERYONE (Only Sender can do this)
    if (deleteForEveryone) {
       if (message.senderId !== userId) {
         throw new Error("Only the sender can delete for everyone");
       }
       return this.prisma.message.update({
         where: { id: messageId },
         data: { 
           isDeletedEveryone: true, 
           content: "🚫 This message was deleted",
           attachmentUrl: null, // Remove attachment link if deleted
           attachmentType: null
         }
       });
    }

    // Case B: Delete for ME (Sender or Receiver)
    if (message.senderId === userId) {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { deletedBySender: true }
      });
    } else if (message.receiverId === userId) {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { deletedByReceiver: true }
      });
    }
  }

  // ==========================================================
  // 4. GET CONVERSATION (With Read Receipts)
  // ==========================================================
  async getMessages(user1: string, user2: string) {
      // A. Mark messages sent BY the other user TO me as "Read"
      await this.prisma.message.updateMany({
        where: { senderId: user2, receiverId: user1, isRead: false },
        data: { isRead: true }
      });
  
      // B. Return History
      return this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: user1, receiverId: user2 },
            { senderId: user2, receiverId: user1 }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
  }
  
  // ==========================================================
  // 5. GET CONTACTS
  // ==========================================================
  async getContacts(userId: string) {
      const bookings = await this.prisma.booking.findMany({
        where: { OR: [{ studentId: userId }, { adminId: userId }] },
        include: { student: true, admin: true }
      });
  
      const contacts = new Map();
  
      bookings.forEach(b => {
        const otherUser = b.studentId === userId ? b.admin : b.student;
        if (!contacts.has(otherUser.id)) {
          contacts.set(otherUser.id, {
            id: otherUser.id,
            name: otherUser.fullName, 
            email: otherUser.email,
            role: otherUser.role,
            lastMsg: "Click to chat",
            date: b.createdAt
          });
        }
      });
      return Array.from(contacts.values());
  }

  // ==========================================================
  // 5. CLEAR CHAT (Hides all messages for this user only)
  // ==========================================================
  async clearChat(userId: string, otherId: string) {
    // 1. Hide messages I SENT
    await this.prisma.message.updateMany({
      where: { senderId: userId, receiverId: otherId },
      data: { deletedBySender: true }
    });

    // 2. Hide messages I RECEIVED
    await this.prisma.message.updateMany({
      where: { senderId: otherId, receiverId: userId },
      data: { deletedByReceiver: true }
    });

    return { success: true };
  }
}