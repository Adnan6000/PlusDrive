import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { LessonService } from './lesson.service';

@Controller('lesson')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  create(@Body() body: any) {
    return this.lessonService.createLesson(body);
  }

  @Get(':category')
  getAll(@Param('category') category: string) {
    return this.lessonService.getLessons(category);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.lessonService.deleteLesson(id);
  }
}