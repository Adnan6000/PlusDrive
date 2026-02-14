import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from './message.service';
import { memoryStorage } from 'multer'; // 👈 Changed from diskStorage
import { v2 as cloudinary } from 'cloudinary'; // 👈 Add this

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

  // ✅ 2. UPLOAD FILE ENDPOINT (Permanent Cloudinary Storage)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(), // 👈 Use memory so it works on Vercel
  }))
  async uploadFile(@UploadedFile() file: any, @Body() body: any) {
    
    // Upload the buffer to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'plusdrive_attachments',
          resource_type: 'auto' // 👈 Automatically handles images or docs
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });

    // result.secure_url is the permanent "https://" link
    return this.messageService.sendMessageWithAttachment(
      body.senderId, 
      body.receiverId, 
      result.secure_url, 
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