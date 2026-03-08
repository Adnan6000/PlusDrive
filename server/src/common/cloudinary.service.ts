import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CloudinaryService {
  private useCloudinary = false;
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    // ✅ If credentials exist (like on Vercel), use Cloudinary. Otherwise, use Native.
    if (cloudName && apiKey && apiSecret) {
      this.useCloudinary = true;
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.logger.log('Cloudinary configured. Uploads will go to the cloud.');
    } else {
      this.logger.warn('Cloudinary keys missing. Falling back to native local storage.');
    }
  }

  async uploadImage(file: any): Promise<string> {
    if (this.useCloudinary) {
      // ☁️ CLOUDINARY MODE
      return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: 'drivebook_payments' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || '');
          },
        );
        upload.end(file.buffer);
      });
    } else {
      // 🖥️ NATIVE VPS MODE (Hostinger)
      return new Promise((resolve, reject) => {
        try {
          // 1. Ensure the 'uploads' folder exists in the root of your backend
          const uploadDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          // 2. Generate a unique filename to prevent overwriting
          const ext = file.originalname ? path.extname(file.originalname) : '.png';
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
          const filePath = path.join(uploadDir, uniqueName);

          // 3. Write the buffer from memory to the VPS hard drive
          fs.writeFileSync(filePath, file.buffer);

          // 4. Return the local URL string (exact same format controllers expect)
          resolve(`/uploads/${uniqueName}`);
        } catch (error) {
          reject(error);
        }
      });
    }
  }
}