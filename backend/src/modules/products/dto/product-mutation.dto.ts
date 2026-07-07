import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ProductImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

class ProductSpecDto {
  @IsOptional()
  @IsString()
  specKey?: string;

  @IsOptional()
  @IsString()
  specValue?: string;
}

class PcComponentDto {
  @IsOptional()
  @IsString()
  componentType?: string;

  @IsOptional()
  socket?: string | null;

  @IsOptional()
  chipset?: string | null;

  @IsOptional()
  ramGeneration?: string | null;

  @IsOptional()
  ramSlots?: number | null;

  @IsOptional()
  maxRamCapacity?: number | null;

  @IsOptional()
  ramCapacity?: number | null;

  @IsOptional()
  ramBus?: number | null;

  @IsOptional()
  formFactor?: string | null;

  @IsOptional()
  gpuLengthMm?: number | null;

  @IsOptional()
  maxGpuLengthMm?: number | null;

  @IsOptional()
  cpuCoolerHeightMm?: number | null;

  @IsOptional()
  maxCpuCoolerHeightMm?: number | null;

  @IsOptional()
  powerConsumption?: number | null;

  @IsOptional()
  powerSupplyWatt?: number | null;

  @IsOptional()
  pcieVersion?: string | null;

  @IsOptional()
  storageInterface?: string | null;
}

export class CreateProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  slug: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  longDescription?: string;

  @IsOptional()
  @IsBoolean()
  isPcComponent?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aiTags?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PcComponentDto)
  pcComponent?: PcComponentDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  spec?: ProductSpecDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  longDescription?: string;

  @IsOptional()
  @IsBoolean()
  isPcComponent?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aiTags?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PcComponentDto)
  pcComponent?: PcComponentDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  spec?: ProductSpecDto[];
}
