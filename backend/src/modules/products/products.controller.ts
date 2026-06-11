import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':slug/specs')
  getSpecs(@Param('slug') slug: string) {
    return this.productsService.getSpecs(slug);
  }

  @Public()
  @Get(':slug/reviews')
  getReviews(@Param('slug') slug: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productsService.getReviews(slug, page, limit);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: any) {
    return this.productsService.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.productsService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':slug/reviews')
  createReview(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() dto: { rating: number; comment?: string },
  ) {
    return this.productsService.createReview(userId, slug, dto);
  }
}
