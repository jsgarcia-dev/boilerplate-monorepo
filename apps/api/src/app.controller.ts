import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('users')
  async getUsers() {
    const users = await this.prismaService.user.findMany();
    return users;
  }

  @Post('users')
  async createUser(@Body() data: { name: string; email: string }) {
    const user = await this.prismaService.user.create({ data });
    return user;
  }
}
