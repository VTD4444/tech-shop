import * as crypto from 'crypto';
import { stripEnvQuotes } from './env.util';

export { stripEnvQuotes } from './env.util';

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

/** IPN / webhook HMAC — `sha256={hex}` over `{timestamp}.{rawBody}` */
export function verifySepayWebhookHmac(
  rawBody: string,
  signatureHeader: string,
  timestampHeader: string,
  secretKey: string,
  maxSkewSeconds = 300,
): boolean {
  if (!secretKey || !signatureHeader || !timestampHeader) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > maxSkewSeconds) return false;

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', secretKey).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');

  const sig = Buffer.from(signatureHeader);
  const exp = Buffer.from(expected);
  if (sig.length !== exp.length) return false;
  return crypto.timingSafeEqual(sig, exp);
}

/** Payment Gateway IPN may include a top-level signature over order fields */
export function verifySepayOrderIpnSignature(
  body: Record<string, unknown>,
  secretKey: string,
): boolean {
  const signature = body.signature;
  if (typeof signature !== 'string' || !signature) return false;

  const order = (body.order ?? {}) as Record<string, string>;
  const fields: Record<string, string> = {};
  for (const key of SEPAY_SIGNED_FIELDS) {
    if (order[key] != null && order[key] !== '') {
      fields[key] = String(order[key]);
    }
  }
  if (!fields.order_amount || !fields.order_invoice_number) return false;

  const expected = signSepayCheckoutFields(fields, secretKey);
  const sig = Buffer.from(signature);
  const exp = Buffer.from(expected);
  if (sig.length !== exp.length) return false;
  return crypto.timingSafeEqual(sig, exp);
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
  const nonce = crypto.randomBytes(3).toString('hex');
  return `INV-${orderId}-${Date.now()}${nonce}`;
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
    secretKeyLength: secretKey.length,
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

/** Server-side probe: POST the same form SePay receives and parse the HTML title. */
export async function probeSepayCheckoutInit(fields: Record<string, string>) {
  const actionUrl = getSepayCheckoutUrl();
  const body = new URLSearchParams(fields).toString();
  const res = await fetch(actionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const html = await res.text();
  const title =
    html.match(/data-state="init"[\s\S]*?title text-center">([^<]+)/)?.[1]?.trim() ||
    html.match(/data-state="error"[\s\S]*?title text-center">([^<]+)/)?.[1]?.trim() ||
    'unknown';
  const accepted = !/không hợp lệ|Lỗi không xác định/i.test(title);
  return { httpStatus: res.status, sepayTitle: title, accepted };
}
