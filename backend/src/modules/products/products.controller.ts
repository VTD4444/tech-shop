import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProductsService } from './products.service';
import { ProductsRatingsService } from './products-ratings.service';
import { ProductsCommentsService } from './products-comments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  CreateRatingDto,
  UpdateRatingDto,
  CreateCommentDto,
  UpdateCommentDto,
  PaginationQueryDto,
} from './dto/engagement.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product-mutation.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private ratingsService: ProductsRatingsService,
    private commentsService: ProductsCommentsService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get(':slug/rating-summary')
  getRatingSummary(@Param('slug') slug: string) {
    return this.ratingsService.getRatingSummary(slug);
  }

  @Public()
  @Get(':slug/ratings')
  listRatings(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.ratingsService.listRatings(slug, query.page, query.limit);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':slug/ratings')
  createRating(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.createRating(userId, slug, dto);
  }

  @Patch(':slug/ratings/:id')
  updateRating(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateRatingDto,
  ) {
    return this.ratingsService.updateRating(userId, slug, id, dto);
  }

  @Get(':slug/engagement')
  getEngagement(@CurrentUser('id') userId: string, @Param('slug') slug: string) {
    return this.productsService.getUserEngagement(userId, slug);
  }

  @Public()
  @Get(':slug/comments')
  listComments(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.commentsService.listComments(slug, query.page, query.limit);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':slug/comments')
  createComment(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(userId, slug, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':slug/comments/:id/replies')
  createReply(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createReply(userId, slug, id, dto);
  }

  @Patch(':slug/comments/:id')
  updateComment(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(userId, slug, id, dto, role === 'admin');
  }

  @Delete(':slug/comments/:id')
  deleteComment(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    return this.commentsService.deleteComment(userId, slug, id, role === 'admin');
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

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
