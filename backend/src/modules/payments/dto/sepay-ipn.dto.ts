import { IsObject, IsOptional, IsString } from 'class-validator';

export class SepayIpnDto {
  @IsOptional()
  @IsString()
  notification_type?: string;

  @IsOptional()
  @IsObject()
  order?: Record<string, unknown>;
}
