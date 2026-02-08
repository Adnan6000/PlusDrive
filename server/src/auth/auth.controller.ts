import { Controller, Post, Body, Get, Param, Put, BadRequestException, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: { token: string }) {
    if (!body.token) throw new BadRequestException("Token is required");
    return this.authService.verifyEmail(body.token);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string, newPassword: string }) {
    return this.authService.performPasswordReset(body.token, body.newPassword);
  }

  @Put('update-profile')
  updateProfile(@Body() body: { userId: string, updates: any }) {
    return this.authService.updateProfile(body.userId, body.updates);
  }

  // FIX: Use the service method instead of direct Prisma call
  @Get('school-instructors/:schoolId')
  async getSchoolInstructors(@Param('schoolId') schoolId: string) {
    return this.authService.getInstructors(schoolId);
  }
  
  @Get('user/:userId')
  async getUser(@Param('userId') userId: string) {
      return this.authService.getUserProfile(userId);
  }

  @Get('students')
  async getStudents() {
    return this.authService.getAllStudents();
  }

  @Put('admin/update-user')
  async adminUpdateUser(@Body() body: { adminId: string, targetUserId: string, updates: any }) {
    return this.authService.updateUserByAdmin(body.adminId, body.targetUserId, body.updates);
  }
  @Get('search-students')
  async searchStudents(@Query('query') query: string) {
  if (!query) return [];
    return this.authService.searchStudents(query);
}
}