import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Changed to bcryptjs for compatibility
import * as crypto from 'crypto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
    private notificationService: NotificationService
  ) {}

  // 1. REGISTER
  async register(data: any) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const existingSchool = await this.prisma.school.findFirst();

    try {
      if (!existingSchool) {
        // First user -> Create School + Instructor
        await this.prisma.school.create({
          data: {
            name: "My Driving School",
            users: {
              create: {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: 'INSTRUCTOR', // Default first user to INSTRUCTOR
                isVerified: false,
                verificationToken: verificationToken
              },
            },
          },
        });
      } else {
        // School exists -> Register Student
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) throw new ConflictException('Email already registered');

        await this.prisma.user.create({
          data: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            role: 'STUDENT',
            schoolId: existingSchool.id,
            isVerified: false,
            verificationToken: verificationToken
          },
        });
      }

      await this.notificationService.sendVerificationEmail(data.email, verificationToken);
      return { message: 'Registration successful! Check console for verification link.' };
    } catch (error) {
      console.log(error);
      throw new BadRequestException("Registration failed.");
    }
  }

  // 2. VERIFY EMAIL
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) throw new BadRequestException('Invalid token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }
    });

    return { message: 'Email verified! You can now login.' };
  }

  // 3. LOGIN
  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isVerified) throw new UnauthorizedException('Please verify your email first.');

    // Add schoolId to payload
    const payload = { sub: user.id, email: user.email, role: user.role, schoolId: user.schoolId };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        schoolId: user.schoolId
      }
    };
  }

  // 4. GET INSTRUCTORS (Critical Fix for Dropdown)
  async getInstructors(schoolId?: string) {
    console.log("Fetching instructors..."); 

    // Fetch users with either INSTRUCTOR or ADMIN role
    const instructors = await this.prisma.user.findMany({
      where: { 
        role: { in: ['INSTRUCTOR', 'ADMIN'] } 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    });

    console.log("Found Instructors:", instructors);
    return instructors;
  }

  // 5. GET ALL STUDENTS
  async getAllStudents(schoolId?: string) {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async searchStudents(query: string) {
  return this.prisma.user.findMany({
    where: {
      role: 'STUDENT',
      OR: [
        { fullName: { contains: query } }, // Remove 'mode: insensitive' if using SQLite default
        { email: { contains: query } }
      ]
    },
    select: { id: true, fullName: true, role: true, email: true },
    take: 10
  });
}

  // 6. UPDATE USER (ADMIN/INSTRUCTOR)
  async updateUserByAdmin(adminId: string, targetUserId: string, updates: any) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    
    // Fix: Allow both ADMIN and INSTRUCTOR to edit
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'INSTRUCTOR')) {
      throw new Error("Unauthorized: Only Instructors/Admins can edit users.");
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        fullName: updates.fullName,
        phone: updates.phone,
        email: updates.email,
        isVerified: updates.isVerified === 'true' || updates.isVerified === true,
      }
    });
  }

  // 7. GET USER PROFILE
  async getUserProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // 8. UPDATE PROFILE (Self)
  async updateProfile(userId: string, updates: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: updates.fullName,
        surname: updates.surname,
        phone: updates.phone,
        address: updates.address,
        city: updates.city,
        zipCode: updates.zipCode,
        autoConfirm: updates.autoConfirm 
      }
    });
  }

  // 9. FORGOT PASSWORD
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If account exists, reset link sent.' };

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry }
    });

    await this.notificationService.sendPasswordResetEmail(email, token);
    return { message: 'Reset link sent check console.' };
  }

  // 10. RESET PASSWORD
  async performPasswordReset(token: string, newPass: string) {
    const user = await this.prisma.user.findFirst({
      where: { 
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) throw new BadRequestException('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetToken: null, 
        resetTokenExpiry: null 
      }
    });

    return { message: 'Password reset successful' };
  }
}