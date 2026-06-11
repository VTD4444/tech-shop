import { describe, it, expect } from 'vitest';
import { useFormatPrice } from '../composables/useFormatPrice';

describe('useFormatPrice', () => {
  it('formats VND currency', () => {
    const { formatPrice } = useFormatPrice();
    expect(formatPrice(1000000)).toContain('1');
    expect(formatPrice(1000000)).toMatch(/₫|VND|đ/i);
  });

  it('handles null as zero', () => {
    const { formatPrice } = useFormatPrice();
    expect(formatPrice(null)).toBeTruthy();
  });
});
