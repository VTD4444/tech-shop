import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRatingsService } from './products-ratings.service';
import { ProductsCommentsService } from './products-comments.service';

@Module({
  imports: [UploadModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRatingsService, ProductsCommentsService],
  exports: [ProductsService],
})
export class ProductsModule {}
