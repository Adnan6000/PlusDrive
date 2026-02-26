import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Post('add')
  async add(@Body() data: { adminId: string; date: string; startTime: string; endTime: string }) {
    // ✅ FIX: Pass data.date as a string. Do NOT wrap it in new Date() here.
    // This prevents the timezone from shifting the day forward or backward.
    return this.service.addAvailability(data.adminId, data.date, data.startTime, data.endTime);
  }

  @Get('/:adminId')
  async get(@Param('adminId') id: string) {
    return this.service.getAvailability(id);
  }

  @Delete('/:id')
  async remove(@Param('id') id: string) {
    return this.service.removeAvailability(id);
  }
}