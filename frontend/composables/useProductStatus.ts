export function useProductStatus() {
  function stockBadge(stockQuantity: number) {
    if (stockQuantity <= 0) {
      return { label: 'OUT OF STOCK', variant: 'danger' as const };
    }
    if (stockQuantity < 5) {
      return { label: 'LOW STOCK', variant: 'warning' as const };
    }
    return { label: 'IN STOCK', variant: 'inStock' as const };
  }

  return { stockBadge };
}
