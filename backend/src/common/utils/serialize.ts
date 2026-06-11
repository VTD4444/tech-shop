/** Convert Prisma BigInt/Decimal values for JSON responses */
export function toNumber(value: unknown): number {
  if (value == null) return 0;
  return Number(value);
}

export function toId(value: unknown): string | null {
  if (value == null) return null;
  return value.toString();
}

export function serializeCategory(c: any) {
  return {
    id: toId(c.id)!,
    name: c.name,
    slug: c.slug,
    parentId: toId(c.parentId),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    children: c.children?.map(serializeCategory),
    parent: c.parent
      ? { id: toId(c.parent.id)!, name: c.parent.name, slug: c.parent.slug }
      : undefined,
  };
}

export function serializeBrand(b: any) {
  return {
    id: toId(b.id)!,
    name: b.name,
    slug: b.slug,
  };
}

export function serializeProduct(p: any) {
  return {
    id: toId(p.id)!,
    categoryId: toId(p.categoryId),
    brandId: toId(p.brandId),
    name: p.name,
    slug: p.slug,
    price: toNumber(p.price),
    stockQuantity: p.stockQuantity,
    imageUrl: p.images?.[0]?.imageUrl ?? p.imageUrl ?? null,
    description: p.description,
    isPcComponent: p.isPcComponent,
    aiTags: p.aiTags ?? [],
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: p.category
      ? { name: p.category.name, slug: p.category.slug }
      : undefined,
    brand: p.brand
      ? { name: p.brand.name, slug: p.brand.slug }
      : undefined,
  };
}
