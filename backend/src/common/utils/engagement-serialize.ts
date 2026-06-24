import { toId } from './serialize';

export function isEdited(createdAt: Date, updatedAt: Date): boolean {
  return updatedAt.getTime() - createdAt.getTime() > 1000;
}

export function serializeRatingUser(user: { id: bigint; username: string }) {
  return { id: toId(user.id)!, username: user.username };
}

export function serializeRating(r: {
  id: bigint;
  userId: bigint;
  productId: bigint;
  orderId: bigint | null;
  rating: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  user: { id: bigint; username: string };
}) {
  return {
    id: toId(r.id)!,
    userId: toId(r.userId)!,
    productId: toId(r.productId)!,
    orderId: toId(r.orderId),
    rating: r.rating,
    images: r.images ?? [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    isEdited: isEdited(r.createdAt, r.updatedAt),
    user: serializeRatingUser(r.user),
  };
}

export function serializeComment(c: {
  id: bigint;
  userId: bigint;
  productId: bigint;
  parentId: bigint | null;
  content: string;
  images: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: bigint; username: string };
  replies?: Array<{
    id: bigint;
    userId: bigint;
    productId: bigint;
    parentId: bigint | null;
    content: string;
    images: string[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id: bigint; username: string };
  }>;
}) {
  return {
    id: toId(c.id)!,
    userId: toId(c.userId)!,
    productId: toId(c.productId)!,
    parentId: toId(c.parentId),
    content: c.content,
    images: c.images ?? [],
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    isEdited: isEdited(c.createdAt, c.updatedAt),
    user: serializeRatingUser(c.user),
    replies: (c.replies ?? []).map((reply) => ({
      id: toId(reply.id)!,
      userId: toId(reply.userId)!,
      productId: toId(reply.productId)!,
      parentId: toId(reply.parentId),
      content: reply.content,
      images: reply.images ?? [],
      status: reply.status,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      isEdited: isEdited(reply.createdAt, reply.updatedAt),
      user: serializeRatingUser(reply.user),
    })),
  };
}

export function formatOrderLabel(date: Date): string {
  return `Đơn hàng ngày ${date.toLocaleDateString('vi-VN')}`;
}
