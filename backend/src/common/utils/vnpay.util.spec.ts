import { buildVnpaySignData, signVnpayParams, verifyVnpaySignature } from './vnpay.util';

describe('vnpay.util', () => {
  const secret = 'test-secret';

  it('buildVnpaySignData sorts keys', () => {
    const data = buildVnpaySignData({ vnp_Amount: '100', vnp_TxnRef: '1' });
    expect(data).toBe('vnp_Amount=100&vnp_TxnRef=1');
  });

  it('signVnpayParams produces verifiable hash', () => {
    const params = { vnp_Amount: '10000', vnp_TxnRef: 'ref1' };
    const hash = signVnpayParams(params, secret);
    const { valid } = verifyVnpaySignature(
      { ...params, vnp_SecureHash: hash },
      secret,
    );
    expect(valid).toBe(true);
  });

  it('verifyVnpaySignature rejects tampered hash', () => {
    const params = { vnp_Amount: '10000', vnp_TxnRef: 'ref1' };
    const { valid } = verifyVnpaySignature(
      { ...params, vnp_SecureHash: 'bad' },
      secret,
    );
    expect(valid).toBe(false);
  });
});
