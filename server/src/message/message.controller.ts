import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  async send(@Body() body: { senderId: string, receiverId: string, content: string }) {
    return this.messageService.sendMessage(body.senderId, body.receiverId, body.content);
  }

  @Get('history/:user1/:user2')
  async getHistory(@Param('user1') u1: string, @Param('user2') u2: string) {
    return this.messageService.getMessages(u1, u2);
  }

  @Get('contacts/:userId')
  async getContacts(@Param('userId') userId: string) {
    return this.messageService.getContacts(userId);
  }
}