import nodemailer from "nodemailer";
import logger from "../lib/logger";

export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Agentic AI" <noreply@agenticai.dev>',
        to,
        subject,
        html,
      });
    } catch (err) {
      logger.error(`Failed to send email to ${to}:`, err);
    }
  }

  async sendVerificationEmail(to: string, link: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #7C3AED;">Verify your email</h2>
        <p>Welcome to Agentic AI! Please click the button below to verify your email address.</p>
        <a href="${link}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Verify Email</a>
        <p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;
    await this.sendEmail(to, "Verify your Agentic AI account", html);
  }

  async sendPasswordResetEmail(to: string, link: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #7C3AED;">Reset your password</h2>
        <p>You requested to reset your password. Click the button below to continue.</p>
        <a href="${link}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Reset Password</a>
        <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
      </div>
    `;
    await this.sendEmail(to, "Reset your Agentic AI password", html);
  }
}

export const mailService = new MailService();
