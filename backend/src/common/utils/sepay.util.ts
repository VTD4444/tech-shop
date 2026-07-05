import * as crypto from 'crypto';

export const SEPAY_FORM_FIELD_ORDER = [
  'merchant',
  'currency',
  'order_amount',
  'operation',
  'order_description',
  'order_invoice_number',
  'customer_id',
  'payment_method',
  'success_url',
  'error_url',
  'cancel_url',
  'signature',
] as const;

/** Field order for HMAC signature — do not sort alphabetically. */
export const SEPAY_SIGNED_FIELDS = [
  'order_amount',
  'merchant',
  'currency',
  'operation',
  'order_description',
  'order_invoice_number',
  'customer_id',
  'payment_method',
  'success_url',
  'error_url',
  'cancel_url',
] as const;

/** Strip accidental quotes copied from Render/env UI into values. */
export function stripEnvQuotes(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function isSepayDebugEnabled(): boolean {
  return process.env.SEPAY_DEBUG === 'true' || process.env.SEPAY_DEBUG === '1';
}

export function buildSepaySignData(fields: Record<string, string>): string {
  const parts: string[] = [];
  for (const field of SEPAY_SIGNED_FIELDS) {
    if (fields[field] === undefined || fields[field] === null) continue;
    parts.push(`${field}=${fields[field]}`);
  }
  return parts.join(',');
}

export function signSepayCheckoutFields(
  fields: Record<string, string>,
  secretKey: string,
): string {
  const signedString = buildSepaySignData(fields);
  return crypto
    .createHmac('sha256', secretKey)
    .update(signedString, 'utf8')
    .digest('base64');
}

export function getSepayCheckoutUrl(): string {
  if (process.env.SEPAY_CHECKOUT_URL) {
    return stripEnvQuotes(process.env.SEPAY_CHECKOUT_URL);
  }
  if (process.env.SEPAY_ENV === 'production') {
    return 'https://pay.sepay.vn/v1/checkout/init';
  }
  return 'https://pay-sandbox.sepay.vn/v1/checkout/init';
}

export function isSepayProductionCheckout(): boolean {
  const url = getSepayCheckoutUrl();
  return url.includes('pay.sepay.vn') && !url.includes('sandbox');
}

export function resolveSepayCallbackBase(
  envKey: 'SEPAY_SUCCESS_URL' | 'SEPAY_ERROR_URL' | 'SEPAY_CANCEL_URL',
  path: string,
): string {
  const explicit = stripEnvQuotes(process.env[envKey]);
  if (explicit) return explicit;

  const frontend = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  if (frontend) return `${frontend}${path}`;

  return `http://localhost:3001${path}`;
}

/** Fail fast with a clear message before redirecting the user to SePay. */
export function assertSepayCheckoutReady(
  merchantId: string,
  secretKey: string,
  callbacks: { success: string; error: string; cancel: string },
): void {
  const production = isSepayProductionCheckout();
  const sandboxMerchant =
    merchantId.toUpperCase().includes('TEST') || secretKey.startsWith('spsk_test');

  if (production && sandboxMerchant) {
    throw new Error(
      'SePay production đang dùng merchant/secret sandbox (SP-TEST / spsk_test). ' +
        'Vào my.sepay.vn → bật Production → cập nhật SEPAY_MERCHANT_ID và SEPAY_SECRET_KEY trên Render.',
    );
  }

  if (!production && !sandboxMerchant && merchantId && secretKey) {
    throw new Error(
      'Merchant production không được dùng với checkout sandbox. ' +
        'Đặt SEPAY_ENV=production và SEPAY_CHECKOUT_URL=https://pay.sepay.vn/v1/checkout/init.',
    );
  }

  for (const [label, raw] of [
    ['SEPAY_SUCCESS_URL', callbacks.success],
    ['SEPAY_ERROR_URL', callbacks.error],
    ['SEPAY_CANCEL_URL', callbacks.cancel],
  ] as const) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error(`${label} không phải URL hợp lệ.`);
    }

    if (!production) continue;

    if (parsed.protocol !== 'https:') {
      throw new Error(
        `${label} phải dùng HTTPS trên production (hiện tại: ${parsed.protocol}//${parsed.host}).`,
      );
    }
    if (['localhost', '127.0.0.1'].includes(parsed.hostname)) {
      throw new Error(
        `${label} không được trỏ localhost trên production. ` +
          'Cập nhật URL Vercel, ví dụ https://your-app.vercel.app/payments/return?status=success',
      );
    }
  }
}

export function resolveSepayPaymentMethod(): string | undefined {
  const explicit = stripEnvQuotes(process.env.SEPAY_PAYMENT_METHOD);
  if (explicit === '') return undefined;
  if (explicit) return explicit;
  // Sandbox often requires an explicit method; production merchants may only enable CARD/NAPAS.
  if (process.env.SEPAY_ENV === 'sandbox' || getSepayCheckoutUrl().includes('sandbox')) {
    return 'BANK_TRANSFER';
  }
  return undefined;
}

export function buildInvoiceNumber(orderId: string | number | bigint): string {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `INV${orderId}${Date.now()}${suffix}`;
}

export function appendInvoiceToUrl(baseUrl: string, invoiceNumber: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('invoice', invoiceNumber);
  return url.toString();
}

/** Safe payload for logs — never includes secret key or full signature. */
export function buildSepayCheckoutDebugInfo(
  fields: Record<string, string>,
  secretKey: string,
) {
  const signedString = buildSepaySignData(fields);
  const signFieldNames = SEPAY_SIGNED_FIELDS.filter((f) => fields[f] != null);

  const urlChecks = ['success_url', 'error_url', 'cancel_url'].map((key) => {
    const raw = fields[key] ?? '';
    const issues: string[] = [];
    if (raw !== raw.trim()) issues.push('has_leading_or_trailing_whitespace');
    if (raw.startsWith('"') || raw.endsWith('"')) issues.push('has_quote_chars');
    try {
      const u = new URL(raw);
      return { key, host: u.host, protocol: u.protocol, issues };
    } catch {
      return { key, host: '(invalid)', protocol: '', issues: ['invalid_url', ...issues] };
    }
  });

  return {
    sepayEnv: process.env.SEPAY_ENV ?? '(unset)',
    checkoutUrl: getSepayCheckoutUrl(),
    productionCheckout: isSepayProductionCheckout(),
    merchantId: fields.merchant,
    secretKeyPrefix: secretKey ? `${secretKey.slice(0, 8)}...` : '(empty)',
    secretKeyKind: secretKey.startsWith('spsk_test')
      ? 'sandbox'
      : secretKey.startsWith('spsk_live')
        ? 'live'
        : 'unknown',
    orderAmount: fields.order_amount,
    invoiceNumber: fields.order_invoice_number,
    paymentMethod: fields.payment_method ?? '(omitted)',
    customerId: fields.customer_id,
    signFieldNames,
    signedStringLength: signedString.length,
    signatureLength: fields.signature?.length ?? 0,
    urlChecks,
    ...(isSepayDebugEnabled() ? { signedString } : {}),
  };
}
