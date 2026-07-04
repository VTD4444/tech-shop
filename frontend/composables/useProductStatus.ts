export function useProductStatus() {
  function stockBadge(stockQuantity: number) {
    if (stockQuantity <= 0) {
      return { label: 'HẾT HÀNG', variant: 'danger' as const };
    }
    if (stockQuantity < 5) {
      return { label: 'SẮP HẾT', variant: 'warning' as const };
    }
    return { label: 'CÒN HÀNG', variant: 'inStock' as const };
  }

  return { stockBadge };
}
