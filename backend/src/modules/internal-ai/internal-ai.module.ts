import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { InternalAiController } from './internal-ai.controller';
import { AiInternalKeyGuard } from '../../common/guards/ai-internal-key.guard';

@Module({
  imports: [ProductsModule],
  controllers: [InternalAiController],
  providers: [AiInternalKeyGuard],
})
export class InternalAiModule {}
