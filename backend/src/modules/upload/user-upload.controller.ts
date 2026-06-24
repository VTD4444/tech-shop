import { Controller, Post } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UserUploadController {
  constructor(private uploadService: UploadService) {}

  @Post('sign')
  signUpload() {
    return this.uploadService.getSignedUploadParams();
  }
}
