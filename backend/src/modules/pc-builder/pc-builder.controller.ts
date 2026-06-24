import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { PcBuilderService } from './pc-builder.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('pc-builder')
export class PcBuilderController {
  constructor(private pcBuilderService: PcBuilderService) {}

  @Public()
  @Get('components/by-product/:slug')
  getComponentByProductSlug(@Param('slug') slug: string) {
    return this.pcBuilderService.getComponentByProductSlug(slug);
  }

  @Public()
  @Get('components')
  getComponents(
    @Query('type') type?: string,
    @Query('selectedIds') selectedIds?: string,
  ) {
    const ids = selectedIds
      ? selectedIds.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    return this.pcBuilderService.getComponents(type, ids);
  }

  @Public()
  @Post('validate')
  validateBuild(@Body() dto: { componentIds: string[] }) {
    return this.pcBuilderService.validateBuild(dto.componentIds);
  }

  @Post('build')
  saveBuild(
    @CurrentUser('id') userId: string,
    @Body() dto: { name: string; componentIds: string[] },
  ) {
    return this.pcBuilderService.saveBuild(userId, dto);
  }

  @Get('builds')
  getBuilds(@CurrentUser('id') userId: string) {
    return this.pcBuilderService.getBuilds(userId);
  }

  @Get('builds/:id')
  getBuildDetail(
    @Param('id') buildId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pcBuilderService.getBuildDetail(buildId, userId);
  }

  @Delete('builds/:id')
  deleteBuild(
    @Param('id') buildId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pcBuilderService.deleteBuild(buildId, userId);
  }
}
