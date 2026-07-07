import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../../common/decorators/match.decorator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^0\d{9}$/, { message: 'Phone must be a valid Vietnamese number (10 digits)' })
  phone: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}

export class GoogleCompleteDto {
  @IsString()
  code: string;
}
