import { Body, Controller, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post("pdf")
  async downloadPDF(@Body() body): Promise<{ doc: string }> {
    console.log({ body })
    return await this.appService.generatePDF();
  }

  @Post("email")
  async sendEmail(@Body() body): Promise<{ email: string }> {
    return await this.appService.sendEmail()
  }
}
