import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DKPHARMA_LOGO_BASE64 } from './logo.util';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  @Get('logo.png')
  @ApiOperation({ summary: 'Logo DKPharma công khai dùng trong email HTML' })
  getLogo(@Res() res: Response) {
    const imgBuffer = Buffer.from(DKPHARMA_LOGO_BASE64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(imgBuffer);
  }
}
