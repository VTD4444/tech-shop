import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UserUploadController } from './user-upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController, UserUploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
