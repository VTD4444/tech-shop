import * as crypto from 'crypto';

/** Field order must match SePay docs — do not sort alphabetically. */
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
    return process.env.SEPAY_CHECKOUT_URL;
  }
  if (process.env.SEPAY_ENV === 'production') {
    return 'https://pay.sepay.vn/v1/checkout/init';
  }
  return 'https://pay-sandbox.sepay.vn/v1/checkout/init';
}

export function buildInvoiceNumber(orderId: string | number | bigint): string {
  const suffix = crypto.randomBytes(3).toString('hex');
  return `TS-${orderId}-${Date.now()}-${suffix}`;
}

export function appendInvoiceToUrl(baseUrl: string, invoiceNumber: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('invoice', invoiceNumber);
  return url.toString();
}
