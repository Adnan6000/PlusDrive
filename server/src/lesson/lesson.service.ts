import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class LessonService {
  private prisma = new PrismaClient();

  async createLesson(data: any) {
    return this.prisma.lesson.create({ data });
  }

  async getLessons(category: string) {
    return this.prisma.lesson.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteLesson(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }
}