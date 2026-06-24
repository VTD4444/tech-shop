import { sanitizeLongDescription, sanitizePlainText } from './html-sanitize';

describe('html-sanitize', () => {
  it('strips script tags', () => {
    const result = sanitizeLongDescription('<p>Hi</p><script>alert(1)</script>');
    expect(result).not.toContain('script');
    expect(result).toContain('Hi');
  });

  it('rejects data URI images', () => {
    const result = sanitizeLongDescription('<img src="data:image/png;base64,abc" />');
    expect(result ?? '').not.toContain('data:image');
  });

  it('sanitizes plain text comments', () => {
    expect(sanitizePlainText('<b>hello</b>')).toBe('hello');
  });
});
