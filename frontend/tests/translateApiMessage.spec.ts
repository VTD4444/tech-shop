import { describe, it, expect } from 'vitest';
import { extractApiMessage, translateApiMessage } from '../utils/translateApiMessage';

describe('translateApiMessage', () => {
  it('translates known English API messages', () => {
    expect(translateApiMessage('Invalid credentials')).toBe('Email hoặc mật khẩu không đúng');
    expect(translateApiMessage('Cart is empty')).toBe('Giỏ hàng trống');
  });

  it('keeps Vietnamese messages unchanged', () => {
    expect(translateApiMessage('Đã thêm vào giỏ hàng')).toBe('Đã thêm vào giỏ hàng');
  });

  it('translates dynamic stock messages', () => {
    expect(translateApiMessage('Insufficient stock for "RTX 4090". Available: 2')).toBe(
      'Không đủ tồn kho cho "RTX 4090". Còn lại: 2',
    );
  });

  it('extracts nested API error messages', () => {
    expect(
      extractApiMessage({
        data: { error: { message: 'You already rated this purchase' } },
      }),
    ).toBe('Bạn đã đánh giá đơn mua này');
  });
});
