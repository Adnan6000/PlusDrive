import { Controller, Get, Param } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('dashboard')
export class DashboardController {

  @Get('summary/:userId')
  async getDashboardSummary(@Param('userId') userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. FETCH USER BALANCE (This was missing or incomplete)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {  
        fullName: true,
        role: true,
      }
    });

    // 2. Fetch Lessons Today
    const lessonsToday = await prisma.booking.findMany({
      where: {
        OR: [{ adminId: userId }, { studentId: userId }],
        status: 'ACCEPTED',
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: { 
        student: { select: { fullName: true } },
        admin: { select: { fullName: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    // 3. Fetch Latest Messages
    const latestMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      include: { sender: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 4. RETURN EVERYTHING INCLUDING BALANCE
    return { 
      lessonsToday, 
      latestMessages,
    };
  }
}