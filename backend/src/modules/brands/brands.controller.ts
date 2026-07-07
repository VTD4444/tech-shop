import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Public()
  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.brandsService.findBySlug(slug);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
