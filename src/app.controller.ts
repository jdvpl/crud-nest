import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get("pdf")
  async downloadPDF(@Res() res): Promise<void> {
    const buffer = await this.appService.generatePDF();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer)
  }
}
