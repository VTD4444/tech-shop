import { Controller, Post } from '@nestjs/common';
import { UploadService } from './upload.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/uploads')
@Roles('admin')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('sign')
  signUpload() {
    return this.uploadService.getSignedUploadParams();
  }
}
