import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminOrdersQueryDto {
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
  @IsIn(['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'completed'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateOrderStatusQueryDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'])
  status: string;
}
