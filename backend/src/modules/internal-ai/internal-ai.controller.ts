import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AiInternalKeyGuard } from '../../common/guards/ai-internal-key.guard';
import { ProductsService } from '../products/products.service';

/**
 * Internal endpoints for the AI Advisor service.
 * Auth: optional X-AI-Internal-Key (required in production when AI_INTERNAL_API_KEY is set).
 */
@Public()
@UseGuards(AiInternalKeyGuard)
@Controller('internal/ai')
export class InternalAiController {
  constructor(private productsService: ProductsService) {}

  @Get('catalog')
  getCatalog() {
    return this.productsService.getAiCatalog();
  }
}
