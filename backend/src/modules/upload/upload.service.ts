import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }

  getSignedUploadParams() {
    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME) {
      throw new BadRequestException('Cloudinary is not configured');
    }
    const folder = process.env.CLOUDINARY_FOLDER || 'techshop/products';
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET,
    );
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
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
      if (process.env.NODE_ENV !== 'production' && (host === 'localhost' || host === '127.0.0.1')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
