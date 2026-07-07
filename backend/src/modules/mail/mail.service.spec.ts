import { MailService } from './mail.service';

describe('MailService', () => {
  it('isSandboxRestriction detects Resend sandbox errors', () => {
    expect(
      MailService.isSandboxRestriction(
        'You can only send testing emails to your own email address',
      ),
    ).toBe(true);
    expect(MailService.isSandboxRestriction('verify a domain at resend.com')).toBe(true);
    expect(MailService.isSandboxRestriction('Invalid API key')).toBe(false);
  });
});
