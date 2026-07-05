import {
  buildInvoiceNumber,
  buildSepaySignData,
  signSepayCheckoutFields,
  appendInvoiceToUrl,
  resolveSepayCallbackBase,
  assertSepayCheckoutReady,
} from './sepay.util';

describe('sepay.util', () => {
  const secret = 'test-secret-key';

  it('buildSepaySignData uses whitelist order (not alphabetical)', () => {
    const data = buildSepaySignData({
      currency: 'VND',
      merchant: 'M1',
      order_amount: '100000',
      operation: 'PURCHASE',
      order_description: 'Test',
      order_invoice_number: 'TS-1-1',
      customer_id: '1',
      payment_method: 'BANK_TRANSFER',
      success_url: 'https://example.com/success',
      error_url: 'https://example.com/error',
      cancel_url: 'https://example.com/cancel',
    });

    expect(data).toBe(
      [
        'order_amount=100000',
        'merchant=M1',
        'currency=VND',
        'operation=PURCHASE',
        'order_description=Test',
        'order_invoice_number=TS-1-1',
        'customer_id=1',
        'payment_method=BANK_TRANSFER',
        'success_url=https://example.com/success',
        'error_url=https://example.com/error',
        'cancel_url=https://example.com/cancel',
      ].join(','),
    );
  });

  it('buildSepaySignData skips missing optional fields', () => {
    const data = buildSepaySignData({
      order_amount: '50000',
      merchant: 'M1',
      currency: 'VND',
      operation: 'PURCHASE',
    });
    expect(data).toBe(
      'order_amount=50000,merchant=M1,currency=VND,operation=PURCHASE',
    );
  });

  it('signSepayCheckoutFields produces stable base64 HMAC-SHA256', () => {
    const fields = {
      order_amount: '100000',
      merchant: 'MERCHANT_123',
      currency: 'VND',
      operation: 'PURCHASE',
      order_description: 'Thanh toan don hang #1',
      order_invoice_number: 'TS-1-123',
      customer_id: '1',
      payment_method: 'BANK_TRANSFER',
      success_url: 'http://localhost:3001/payments/return?status=success',
      error_url: 'http://localhost:3001/payments/return?status=error',
      cancel_url: 'http://localhost:3001/payments/return?status=cancel',
    };

    const sig1 = signSepayCheckoutFields(fields, secret);
    const sig2 = signSepayCheckoutFields(fields, secret);
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[A-Za-z0-9+/=]+$/);

    const tampered = signSepayCheckoutFields(
      { ...fields, order_amount: '1' },
      secret,
    );
    expect(tampered).not.toBe(sig1);
  });

  it('buildInvoiceNumber is unique per call', () => {
    const a = buildInvoiceNumber(42);
    const b = buildInvoiceNumber(42);
    expect(a).toMatch(/^TS-42-\d+-[a-f0-9]+$/);
    expect(a).not.toBe(b);
  });

  it('appendInvoiceToUrl preserves existing query and sets invoice', () => {
    const url = appendInvoiceToUrl(
      'http://localhost:3001/payments/return?status=success',
      'TS-1-99',
    );
    expect(url).toContain('status=success');
    expect(url).toContain('invoice=TS-1-99');
  });

  it('resolveSepayCallbackBase prefers FRONTEND_URL when env unset', () => {
    const prev = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://shop.example.com';
    delete process.env.SEPAY_SUCCESS_URL;
    expect(resolveSepayCallbackBase('SEPAY_SUCCESS_URL', '/payments/return?status=success')).toBe(
      'https://shop.example.com/payments/return?status=success',
    );
    process.env.FRONTEND_URL = prev;
  });

  it('assertSepayCheckoutReady rejects sandbox merchant on production checkout', () => {
    const prevEnv = process.env.SEPAY_ENV;
    const prevUrl = process.env.SEPAY_CHECKOUT_URL;
    process.env.SEPAY_ENV = 'production';
    delete process.env.SEPAY_CHECKOUT_URL;
    expect(() =>
      assertSepayCheckoutReady('SP-TEST-ABC', 'spsk_test_xyz', {
        success: 'https://shop.example.com/payments/return?status=success',
        error: 'https://shop.example.com/payments/return?status=error',
        cancel: 'https://shop.example.com/payments/return?status=cancel',
      }),
    ).toThrow(/sandbox/i);
    process.env.SEPAY_ENV = prevEnv;
    process.env.SEPAY_CHECKOUT_URL = prevUrl;
  });
});
