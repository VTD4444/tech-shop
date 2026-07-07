import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type MailSendResult = { ok: true } | { ok: false; error: string };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('app.mail.resendApiKey', '');
    this.from = this.config.get<string>('app.mail.from', '');
    this.frontendUrl = this.config.get<string>('app.frontendUrl', 'http://localhost:3001');

    if (apiKey) {
      this.resend = new Resend(apiKey);
      if (this.from) {
        this.logger.log(`Resend configured (from: ${this.from})`);
      } else {
        this.logger.warn('RESEND_API_KEY set but MAIL_FROM is missing');
      }
    } else {
      this.logger.warn('RESEND_API_KEY not set — transactional email disabled');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<MailSendResult> {
    if (!this.resend || !this.from) {
      this.logger.warn(`Email skipped (not configured): ${subject} -> ${to}`);
      return { ok: false, error: 'Email service not configured' };
    }
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Resend rejected email "${subject}" -> ${to}: ${error.message}`);
        return { ok: false, error: error.message };
      }
      this.logger.log(`Email sent: ${subject} -> ${to} (id: ${data?.id ?? 'n/a'})`);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown send error';
      this.logger.error(`Failed to send email: ${subject} -> ${to}`, err);
      return { ok: false, error: message };
    }
  }

  async sendOrderCreated(to: string, orderId: string, totalAmount: number) {
    const result = await this.send(
      to,
      `Order #${orderId} confirmed`,
      `<p>Your order <strong>#${orderId}</strong> was placed successfully.</p>
       <p>Total: <strong>${totalAmount.toLocaleString('vi-VN')} VND</strong></p>
       <p><a href="${this.frontendUrl}/orders/${orderId}">View order</a></p>`,
    );
    return result.ok;
  }

  async sendOrderPaid(to: string, orderId: string, totalAmount: number) {
    const result = await this.send(
      to,
      `Payment received for order #${orderId}`,
      `<p>We received your payment for order <strong>#${orderId}</strong>.</p>
       <p>Amount: <strong>${totalAmount.toLocaleString('vi-VN')} VND</strong></p>
       <p><a href="${this.frontendUrl}/orders/${orderId}">View order</a></p>`,
    );
    return result.ok;
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<MailSendResult> {
    return this.send(
      to,
      'Đặt lại mật khẩu TechShop',
      `<p>Bạn vừa yêu cầu đặt lại mật khẩu TechShop (hiệu lực 1 giờ).</p>
       <p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>
       <p>Hoặc copy link: ${resetUrl}</p>
       <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    );
  }

  isConfigured(): boolean {
    return Boolean(this.resend && this.from);
  }

  static isSandboxRestriction(error: string): boolean {
    const lower = error.toLowerCase();
    return lower.includes('testing emails') || lower.includes('verify a domain');
  }
}
