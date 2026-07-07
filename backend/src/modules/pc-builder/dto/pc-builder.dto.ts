import { ArrayMinSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateBuildDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  componentIds: string[];
}

export class SaveBuildDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  componentIds: string[];
}
