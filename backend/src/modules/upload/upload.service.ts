import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly productFolder: string;
  private readonly userFolder: string;

  constructor(private readonly config: ConfigService) {
    this.cloudName = this.config.get<string>('app.cloudinary.cloudName', '');
    this.apiKey = this.config.get<string>('app.cloudinary.apiKey', '');
    this.apiSecret = this.config.get<string>('app.cloudinary.apiSecret', '');
    this.productFolder = this.config.get<string>('app.cloudinary.folder', 'techshop/products');
    this.userFolder = this.config.get<string>(
      'app.cloudinary.userFolder',
      'techshop/user-uploads',
    );

    if (this.cloudName) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    }
  }

  getSignedUploadParams(folder?: string) {
    if (!this.apiSecret || !this.cloudName) {
      throw new BadRequestException('Cloudinary is not configured');
    }
    const targetFolder = folder || this.productFolder;
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder: targetFolder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret);
    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      folder: targetFolder,
      signature,
    };
  }

  getProductUploadParams() {
    return this.getSignedUploadParams(this.productFolder);
  }

  getUserUploadParams() {
    return this.getSignedUploadParams(this.userFolder);
  }

  static isAllowedImageUrl(url: string): boolean {
    if (!url) return false;
    try {
      const host = new URL(url).hostname;
      if (host.endsWith('cloudinary.com') || host.endsWith('res.cloudinary.com')) {
        return true;
      }
      return host === 'localhost' || host === '127.0.0.1';
    } catch {
      return false;
    }
  }
}
