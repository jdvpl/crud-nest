import { Body, Controller, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post("pdf")
  async downloadPDF(@Res() res):Promise<void> {
    console.log("aca entro")
    const buffer= await this.appService.generatePDF();
    console.log(buffer)
    res.set({
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename=lol.pdf',
      'content-Length': buffer.length
    })
    res.end(buffer)
  }

  @Post("email")
  async sendEmail(@Body() body): Promise<{ email: string }> {
    return await this.appService.sendEmail()
  }
}
