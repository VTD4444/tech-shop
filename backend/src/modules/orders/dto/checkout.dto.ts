import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  shippingAddressId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
