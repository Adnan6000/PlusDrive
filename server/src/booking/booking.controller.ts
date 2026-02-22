import { Controller, Post, Body, Get, Param, Put, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookingService } from './booking.service';
import { CloudinaryService } from '../common/cloudinary.service';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly service: BookingService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  // ==========================================================
  // 1. CORE BOOKING ROUTES
  // ==========================================================

  @Post('request')
  async request(@Body() d: { 
    studentId: string, 
    availabilityId: string, 
    type: string, 
    note: string,
    reqLocation?: string,
    reqLat?: number,
    reqLng?: number
  }) {
    return this.service.createBookingRequest(d.studentId, d.availabilityId, d.type, d.note, d.reqLocation, d.reqLat, d.reqLng);
  }

  @Put('status')
  async respond(@Body() d: { bookingId: string, action: 'CONFIRMED' | 'REJECTED' }) {
    return this.service.respondToBooking(d.bookingId, d.action);
  }

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string) {
    return this.service.getDashboardStats(userId);
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

  // ==========================================================
  // 2. INVOICE & FINANCE ROUTES
  // ==========================================================

  @Post('generate-invoice')
  async generateInvoice(@Body() data: { studentId: string, amount: number, dueDate: string, description: string }) {
    return this.service.generateInvoice(data);
  }

  @Get('invoices/all')
  async getAllInvoices() {
    return this.service.getAllInvoices();
  }

  @Get('invoices/student/:id')
  async getStudentInvoices(@Param('id') studentId: string) {
    return this.service.getStudentInvoices(studentId);
  }

  @Post('invoice/:id/pay')
  @UseInterceptors(FileInterceptor('file')) // ✅ MUST match formData.append('file', ...)
  async payInvoice(
    @Param('id') invoiceId: string,
    @UploadedFile() file: any
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    
    // Upload to Cloudinary
    const proofUrl = await this.cloudinaryService.uploadImage(file);
    
    // Update invoice status to 'REVIEWING'
    return this.service.processInvoicePayment(invoiceId, proofUrl);
  }

  @Put('invoice/:id/status')
  async updateInvoiceStatus(
    @Param('id') invoiceId: string,
    @Body() body: { status: 'PAID' | 'REJECTED', note?: string }
  ) {
    return this.service.updateInvoiceStatus(invoiceId, body.status, body.note);
  }

  @Put('school-settings/:id')
  async updateSchoolFinance(@Param('id') schoolId: string, @Body() body: { bankRegNum: string, bankAccountNum: string }) {
    return this.service.updateSchoolFinance(schoolId, body);
  }

  // ==========================================================
  // 3. PICKUP LOCATION ROUTES
  // ==========================================================
  @Put(':id/pickup/request')
  async requestPickup(@Param('id') bookingId: string, @Body() body: any) {
    // body should contain: { userId, location, lat, lng, note }
    return this.service.updatePickupRequest(bookingId, body.userId, body);
  }

  @Put(':id/pickup/decide')
  async decidePickup(@Param('id') bookingId: string, @Body() body: any) {
    // body should contain: { instructorId, action, location, lat, lng, note }
    return this.service.respondToPickup(bookingId, body.instructorId, body.action, body);
  }
}