import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly folder: string;

  constructor(private readonly config: ConfigService) {
    this.cloudName = this.config.get<string>('app.cloudinary.cloudName', '');
    this.apiKey = this.config.get<string>('app.cloudinary.apiKey', '');
    this.apiSecret = this.config.get<string>('app.cloudinary.apiSecret', '');
    this.folder = this.config.get<string>('app.cloudinary.folder', 'techshop/products');

    if (this.cloudName) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    }
  }

  getSignedUploadParams() {
    if (!this.apiSecret || !this.cloudName) {
      throw new BadRequestException('Cloudinary is not configured');
    }
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder: this.folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret);
    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      folder: this.folder,
      signature,
    };
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
