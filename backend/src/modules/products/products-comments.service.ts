import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { sanitizePlainText } from '../../common/utils/html-sanitize';
import { serializeComment } from '../../common/utils/engagement-serialize';
import { CreateCommentDto, UpdateCommentDto } from './dto/engagement.dto';

@Injectable()
export class ProductsCommentsService {
  constructor(private prisma: PrismaService) {}

  private validateImageUrls(images?: string[]) {
    if (!images?.length) return;
    if (images.length > 5) throw new BadRequestException('Maximum 5 images allowed');
    for (const url of images) {
      if (!UploadService.isAllowedImageUrl(url)) {
        throw new BadRequestException(`Invalid image URL: ${url}`);
      }
    }
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async listComments(slug: string, page = 1, limit = 10) {
    const product = await this.getProductBySlug(slug);
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(50, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const where = { productId: product.id, parentId: null, status: 'active' as const };

    const [data, total] = await Promise.all([
      this.prisma.productComment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true } },
          replies: {
            where: { status: 'active' },
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: { user: { select: { id: true, username: true } } },
          },
        },
      }),
      this.prisma.productComment.count({ where }),
    ]);

    return {
      data: data.map(serializeComment),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async createComment(userId: string, slug: string, dto: CreateCommentDto) {
    const product = await this.getProductBySlug(slug);
    this.validateImageUrls(dto.images);
    const content = sanitizePlainText(dto.content);
    if (!content) throw new BadRequestException('Comment content is required');

    const comment = await this.prisma.productComment.create({
      data: {
        userId: BigInt(userId),
        productId: product.id,
        content,
        images: dto.images ?? [],
        status: 'active',
      },
      include: {
        user: { select: { id: true, username: true } },
        replies: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    return serializeComment(comment);
  }

  async createReply(userId: string, slug: string, parentId: string, dto: CreateCommentDto) {
    const product = await this.getProductBySlug(slug);
    const parent = await this.prisma.productComment.findFirst({
      where: { id: BigInt(parentId), productId: product.id, parentId: null, status: 'active' },
    });
    if (!parent) {
      throw new NotFoundException({
        success: false,
        error: { code: 'COMMENT_NOT_FOUND', message: 'Parent comment not found' },
      });
    }

    this.validateImageUrls(dto.images);
    const content = sanitizePlainText(dto.content);
    if (!content) throw new BadRequestException('Reply content is required');

    const reply = await this.prisma.productComment.create({
      data: {
        userId: BigInt(userId),
        productId: product.id,
        parentId: parent.id,
        content,
        images: dto.images ?? [],
        status: 'active',
      },
      include: { user: { select: { id: true, username: true } } },
    });

    return serializeComment({ ...reply, replies: [] });
  }

  async updateComment(userId: string, slug: string, commentId: string, dto: UpdateCommentDto, isAdmin = false) {
    const product = await this.getProductBySlug(slug);
    const comment = await this.prisma.productComment.findFirst({
      where: { id: BigInt(commentId), productId: product.id },
      include: {
        user: { select: { id: true, username: true } },
        replies: {
          where: { status: 'active' },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!isAdmin && comment.userId.toString() !== userId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'COMMENT_FORBIDDEN', message: 'Not your comment' },
      });
    }

    this.validateImageUrls(dto.images);
    const content = sanitizePlainText(dto.content);
    if (!content) throw new BadRequestException('Comment content is required');

    const updated = await this.prisma.productComment.update({
      where: { id: comment.id },
      data: {
        content,
        ...(dto.images != null ? { images: dto.images } : {}),
      },
      include: {
        user: { select: { id: true, username: true } },
        replies: {
          where: { status: 'active' },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    return serializeComment(updated);
  }

  async deleteComment(userId: string, slug: string, commentId: string, isAdmin = false) {
    const product = await this.getProductBySlug(slug);
    const comment = await this.prisma.productComment.findFirst({
      where: { id: BigInt(commentId), productId: product.id },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!isAdmin && comment.userId.toString() !== userId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'COMMENT_FORBIDDEN', message: 'Not your comment' },
      });
    }

    await this.prisma.productComment.delete({ where: { id: comment.id } });
    return { success: true };
  }
}
