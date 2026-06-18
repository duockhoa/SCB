import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { RecipientService } from './recipient.service';

@Module({
  providers: [MailService, RecipientService],
  exports: [MailService, RecipientService],
})
export class MailModule {}
