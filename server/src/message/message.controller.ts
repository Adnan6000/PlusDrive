import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessageService } from './message.service';

// ✅ FIX 1: Must be plural 'messages' to match Frontend
@Controller('messages') 
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  async send(@Body() body: { 
    senderId: string; 
    receiverId: string; 
    content: string; 
    isChat?: boolean; // ✅ FIX 2: Accept isChat flag
  }) {
    return this.messageService.sendMessage(
      body.senderId, 
      body.receiverId, 
      body.content, 
      body.isChat 
    );
  }

  // ✅ FIX 3: Route must be 'conversation', not 'history'
  @Get('conversation/:user1/:user2')
  async getHistory(@Param('user1') u1: string, @Param('user2') u2: string) {
    return this.messageService.getMessages(u1, u2);
  }

  // ✅ FIX 4: Route must be 'inbox', not 'contacts'
  @Get('inbox/:userId')
  async getContacts(@Param('userId') userId: string) {
    return this.messageService.getContacts(userId);
  }
}