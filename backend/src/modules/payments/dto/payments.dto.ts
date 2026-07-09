import { IsString, Matches } from 'class-validator';

export class CreateCheckoutQueryDto {
  @IsString()
  @Matches(/^\d+$/, { message: 'orderId must be a numeric string' })
  orderId: string;
}

export class AbandonCheckoutDto {
  @IsString()
  invoice: string;
}
