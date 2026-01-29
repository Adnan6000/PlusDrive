import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

  // 1. LOGIN (New Feature)
  async login(email: string, pass: string) {
    // A. Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // B. Check the password
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // C. Create the Digital Key (Token)
    const payload = { sub: user.id, email: user.email, role: user.role, schoolId: user.schoolId };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      }
    };
  }

  // 2. REGISTER (Existing Feature)
  async register(createAuthDto: CreateAuthDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: createAuthDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createAuthDto.password, salt);

    const newSchool = await prisma.school.create({
      data: {
        name: createAuthDto.schoolName,
        users: {
          create: {
            email: createAuthDto.email,
            password: hashedPassword,
            fullName: createAuthDto.fullName,
            role: 'ADMIN',
            balance: 0,
          },
        },
      },
      include: { users: true },
    });

    return {
      message: 'Registration successful',
      schoolId: newSchool.id,
      adminId: newSchool.users[0].id,
    };
  }


  // 3. ADD INSTRUCTOR
  async addInstructor(data: { fullName: string, email: string, schoolId: string }) {
    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    // Create instructor with a temporary password (they should change it later)
    const salt = await bcrypt.genSalt(10);
    const tempPassword = await bcrypt.hash('Instructor123!', salt);

    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: tempPassword,
        role: 'INSTRUCTOR',
        schoolId: data.schoolId,
      },
      select: { id: true, fullName: true, email: true } // Don't return the password
    });
  }
  //Get all instructors for school.
  async getInstructors(schoolId: string) {
    return prisma.user.findMany({
      where: {
        schoolId: schoolId,
        role: 'INSTRUCTOR',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async deleteInstructor(id: string) {
    return prisma.user.delete({ where: { id } });
  }
  async updateInstructor(id: string, data: { fullName?: string, email?: string }) {
    return prisma.user.update({
      where: { id },
      data: data,
      select: { id: true, fullName: true, email: true }
    });
  }
  // Add a New Student
  async addStudent(data: { fullName: string, email: string, phone: string, schoolId: string }) {
    const existing = await prisma.student.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Student email already registered');

    return prisma.student.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        schoolId: data.schoolId,
      }
    });
  }

  // Get All Students for a School
  async getStudents(schoolId: string) {
    return prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }
    });
  }
}