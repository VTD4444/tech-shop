import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
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

class ProductSpecObjectDto {
  @IsOptional()
  @IsString()
  cpuBrand?: string | null;

  @IsOptional()
  @IsString()
  cpuSeries?: string | null;

  @IsOptional()
  @IsString()
  cpuModel?: string | null;

  @IsOptional()
  @IsNumber()
  ramCapacity?: number | null;

  @IsOptional()
  @IsString()
  ramGeneration?: string | null;

  @IsOptional()
  @IsNumber()
  storageCapacity?: number | null;

  @IsOptional()
  @IsString()
  storageType?: string | null;

  @IsOptional()
  @IsString()
  gpuModel?: string | null;

  @IsOptional()
  @IsNumber()
  screenSize?: number | null;

  @IsOptional()
  @IsObject()
  specs?: Record<string, string> | null;
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
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  brandId?: string | null;

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
  @IsIn(['active', 'inactive', 'discontinued'])
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
  @ValidateNested()
  @Type(() => ProductSpecObjectDto)
  spec?: ProductSpecObjectDto | null;
}

export class UpdateProductDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString()
  brandId?: string | null;

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
  @IsIn(['active', 'inactive', 'discontinued'])
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
  @ValidateNested()
  @Type(() => ProductSpecObjectDto)
  spec?: ProductSpecObjectDto | null;
}
