import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'Phone must be a valid Vietnamese number (10 digits)' })
  phone?: string;
}

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  receiverName: string;

  @IsString()
  @Matches(/^0\d{9}$/, { message: 'Phone must be a valid Vietnamese number (10 digits)' })
  phone: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  addressLine: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  receiverName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'Phone must be a valid Vietnamese number (10 digits)' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  isDefault?: boolean;
}
