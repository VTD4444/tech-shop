import * as crypto from 'crypto';

export function buildVnpaySignData(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  return sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
}

export function verifyVnpaySignature(
  query: Record<string, unknown>,
  secretKey: string,
): { valid: boolean; params: Record<string, string> } {
  const secureHash = query.vnp_SecureHash as string;
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') continue;
    params[key] = String(value);
  }
  const signData = buildVnpaySignData(params);
  const hmac = crypto.createHmac('sha512', secretKey);
  const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  return { valid: secureHash === checkHash, params };
}

export function signVnpayParams(params: Record<string, string>, secretKey: string): string {
  const signData = buildVnpaySignData(params);
  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

export function getVnpayPaymentUrl(): string {
  if (process.env.VNPAY_ENV === 'production') {
    return process.env.VNPAY_URL || 'https://vnpayment.vn/paymentv2/vpcpay.html';
  }
  return (
    process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
  );
}
