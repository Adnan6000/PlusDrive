import { Controller, Get, Param, Put } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return this.service.getNotifications(userId);
  }

  @Put(':id/read')
  async markRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }
}