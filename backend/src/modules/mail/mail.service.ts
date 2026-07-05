import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { stripEnvQuotes } from '../../common/utils/sepay.util';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly from: string;

  constructor() {
    const apiKey = stripEnvQuotes(process.env.RESEND_API_KEY);
    this.from = stripEnvQuotes(process.env.MAIL_FROM);

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

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.resend || !this.from) {
      this.logger.warn(`Email skipped (not configured): ${subject} -> ${to}`);
      return false;
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
        return false;
      }
      this.logger.log(`Email sent: ${subject} -> ${to} (id: ${data?.id ?? 'n/a'})`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email: ${subject} -> ${to}`, err);
      return false;
    }
  }

  async sendOrderCreated(to: string, orderId: string, totalAmount: number) {
    const frontend = stripEnvQuotes(process.env.FRONTEND_URL) || 'http://localhost:3001';
    return this.send(
      to,
      `Order #${orderId} confirmed`,
      `<p>Your order <strong>#${orderId}</strong> was placed successfully.</p>
       <p>Total: <strong>${totalAmount.toLocaleString('vi-VN')} VND</strong></p>
       <p><a href="${frontend}/orders/${orderId}">View order</a></p>`,
    );
  }

  async sendOrderPaid(to: string, orderId: string, totalAmount: number) {
    const frontend = stripEnvQuotes(process.env.FRONTEND_URL) || 'http://localhost:3001';
    return this.send(
      to,
      `Payment received for order #${orderId}`,
      `<p>We received your payment for order <strong>#${orderId}</strong>.</p>
       <p>Amount: <strong>${totalAmount.toLocaleString('vi-VN')} VND</strong></p>
       <p><a href="${frontend}/orders/${orderId}">View order</a></p>`,
    );
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    return this.send(
      to,
      'Reset your TechShop password',
      `<p>Bạn vừa yêu cầu đặt lại mật khẩu TechShop (hiệu lực 1 giờ).</p>
       <p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>
       <p>Hoặc copy link: ${resetUrl}</p>
       <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    );
  }

  isConfigured(): boolean {
    return Boolean(this.resend && this.from);
  }
}
