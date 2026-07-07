import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminCustomersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AdminResetCustomerPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
