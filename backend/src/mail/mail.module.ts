import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { RecipientService } from './recipient.service';
import { EmailConfigController } from './email-config.controller';
import { EmailConfigService } from './email-config.service';

@Module({
  controllers: [EmailConfigController],
  providers: [MailService, RecipientService, EmailConfigService],
  exports: [MailService, RecipientService, EmailConfigService],
})
export class MailModule {}
