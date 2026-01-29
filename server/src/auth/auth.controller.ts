import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Delete, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto'; // We will create this next

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @Post('add-instructor')
  addInstructor(@Body() data: { fullName: string, email: string, schoolId: string }) {
    return this.authService.addInstructor(data);
  }

  @Get('instructors/:schoolId')
  getInstructors(@Param('schoolId') schoolId: string) {
    return this.authService.getInstructors(schoolId);
  }

  @Delete('instructor/:id')
  remove(@Param('id') id: string) {
    return this.authService.deleteInstructor(id);
  }
  @Patch('instructor/:id')
  update(@Param('id') id: string, @Body() data: { fullName?: string, email?: string }) {
  return this.authService.updateInstructor(id, data);
  }
  
  @Post('add-student')
  addStudent(@Body() data: { fullName: string, email: string, phone: string, schoolId: string }) {
    return this.authService.addStudent(data);
  }

  @Get('students/:schoolId')
  getStudents(@Param('schoolId') schoolId: string) {
    return this.authService.getStudents(schoolId);
  }
}