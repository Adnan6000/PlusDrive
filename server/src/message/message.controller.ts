import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from './message.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { tmpdir } from 'os'; // 👈 Import this

@Controller('messages') 
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // 1. Send Text Message
  @Post('send')
  async send(@Body() body: any) {
    return this.messageService.sendMessage(
      body.senderId, body.receiverId, body.content, body.isChat
    );
  }

  // ✅ 2. UPLOAD FILE ENDPOINT (Fixed for Vercel EROFS)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      // 🟢 FIX: Use tmpdir() because /var/task is read-only on Vercel
      destination: tmpdir(), 
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: any, @Body() body: any) {
    // 🔴 IMPORTANT: Files in /tmp are temporary. 
    // For a permanent solution, you must use Cloudinary or Vercel Blob.
    const filePath = `/uploads/${file.filename}`;
    
    return this.messageService.sendMessageWithAttachment(
      body.senderId, 
      body.receiverId, 
      filePath, 
      body.type 
    );
  }

  @Get('conversation/:user1/:user2')
  async getHistory(@Param('user1') u1: string, @Param('user2') u2: string) {
    return this.messageService.getMessages(u1, u2);
  }

  @Get('inbox/:userId')
  async getContacts(@Param('userId') userId: string) {
    return this.messageService.getContacts(userId);
  }

  @Post('delete')
  async deleteMessage(@Body() body: { messageId: string, userId: string, type: 'ME' | 'EVERYONE' }) {
    return this.messageService.deleteMessage(
      body.messageId, 
      body.userId, 
      body.type === 'EVERYONE'
    );
  }

  @Post('clear')
  async clearChat(@Body() body: { userId: string, otherId: string }) {
    return this.messageService.clearChat(body.userId, body.otherId);
  }
}