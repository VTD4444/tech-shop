import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend || !process.env.MAIL_FROM) {
      this.logger.warn(`Email skipped (not configured): ${subject} -> ${to}`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email: ${subject}`, err);
    }
  }

  async sendOrderCreated(to: string, orderId: string, totalAmount: number) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3001';
    await this.send(
      to,
      `Order #${orderId} confirmed`,
      `<p>Your order <strong>#${orderId}</strong> was placed successfully.</p>
       <p>Total: <strong>${totalAmount.toLocaleString('vi-VN')} VND</strong></p>
       <p><a href="${frontend}/orders/${orderId}">View order</a></p>`,
    );
  }

  async sendOrderPaid(to: string, orderId: string, totalAmount: number) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3001';
    await this.send(
      to,
      `Payment received for order #${orderId}`,
      `<p>We received your VNPAY payment for order <strong>#${orderId}</strong>.</p>
       <p>Amount: <strong>${totalAmount.toLocaleString('vi-VN')} VND</strong></p>
       <p><a href="${frontend}/orders/${orderId}">View order</a></p>`,
    );
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    await this.send(
      to,
      'Reset your TechShop password',
      `<p>Click the link below to reset your password (valid for 1 hour):</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>If you did not request this, ignore this email.</p>`,
    );
  }
}
