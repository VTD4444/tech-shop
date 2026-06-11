import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  static ok<T>(data: T, meta?: ApiResponseDto<T>['meta']): ApiResponseDto<T> {
    return { success: true, data, meta };
  }

  static fail(message: string): ApiResponseDto<null> {
    return { success: false, message };
  }
}
