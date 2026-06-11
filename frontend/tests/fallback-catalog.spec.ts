import { describe, expect, it } from 'vitest';
import { filterFallbackProducts, findFallbackProductBySlug } from '../data/fallback-catalog';
import { isApiUnavailableError } from '../utils/api-error';

describe('fallback catalog', () => {
  it('filters products by search term', () => {
    const result = filterFallbackProducts({ search: 'rtx', limit: 20 });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((p) => p.name.toLowerCase().includes('rtx') || p.description?.toLowerCase().includes('rtx'))).toBe(true);
  });

  it('finds product by slug', () => {
    const product = findFallbackProductBySlug('nvidia-rtx-4070-super-fallback');
    expect(product?.name).toContain('4070');
  });
});

describe('isApiUnavailableError', () => {
  it('detects 5xx responses', () => {
    expect(isApiUnavailableError({ statusCode: 503 })).toBe(true);
  });

  it('ignores 404 responses', () => {
    expect(isApiUnavailableError({ statusCode: 404 })).toBe(false);
  });
});
