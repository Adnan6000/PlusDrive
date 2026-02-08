import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller('booking')
export class BookingController {
  constructor(private readonly service: BookingService) {}

  @Post('request')
  async request(@Body() d: { studentId: string, availabilityId: string, type: string, note: string }) {
    return this.service.createBookingRequest(d.studentId, d.availabilityId, d.type, d.note);
  }

  @Put('status')
  async respond(@Body() d: { bookingId: string, action: 'CONFIRMED' | 'REJECTED' }) {
    return this.service.respondToBooking(d.bookingId, d.action);
  }

  @Get('pending/:adminId')
  async getPending(@Param('adminId') id: string) {
    return this.service.getPendingRequests(id);
  }

  @Get('student/:studentId')
  async getStudent(@Param('studentId') id: string) {
    return this.service.getStudentBookings(id);
  }

  @Get('/:userId')
  async getAll(@Param('userId') id: string) {
    return this.service.getAllBookings(id);
  }
  @Get('stats/:userId')
async getStats(@Param('userId') userId: string) {
  return this.service.getDashboardStats(userId);
}
}