import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Agentic AI" <${process.env.SMTP_FROM || 
  'noreply@agenticai.dev'}>`;

const FRONTEND_URL = process.env.FRONTEND_URL || 
  'http://localhost:3000';

export const EmailService = {

  sendVerification: async (
    email: string, 
    name: string,
    token: string
  ): Promise<void> => {
    const url = `${FRONTEND_URL}/auth/verify-email?token=${token}`;
    
    try {
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Verify your Agentic AI account',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#7C3AED">Welcome to Agentic AI, ${name}!</h2>
            <p>Click the button below to verify your email address.</p>
            <a href="${url}" 
               style="display:inline-block;background:#7C3AED;color:#fff;
                      padding:12px 24px;border-radius:8px;
                      text-decoration:none;font-weight:bold;margin:16px 0">
              Verify Email
            </a>
            <p style="color:#888;font-size:13px">
              This link expires in 24 hours.<br>
              If you didn't create an account, ignore this email.
            </p>
            <p style="color:#888;font-size:12px">
              Or copy this link: ${url}
            </p>
          </div>
        `,
      });
      logger.info('Verification email sent', { email });
    } catch (error) {
      logger.error('Failed to send verification email', { 
        email, error 
      });
      // Don't throw — user is already created
      // They can request a resend
    }
  },

  sendPasswordReset: async (
    email: string,
    name: string,
    token: string
  ): Promise<void> => {
    const url = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
    
    try {
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Reset your Agentic AI password',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#7C3AED">Password Reset Request</h2>
            <p>Hi ${name}, we received a request to reset your password.</p>
            <a href="${url}"
               style="display:inline-block;background:#7C3AED;color:#fff;
                      padding:12px 24px;border-radius:8px;
                      text-decoration:none;font-weight:bold;margin:16px 0">
              Reset Password
            </a>
            <p style="color:#888;font-size:13px">
              This link expires in 1 hour.<br>
              If you didn't request this, ignore this email — 
              your password will not be changed.
            </p>
          </div>
        `,
      });
      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Failed to send password reset email', { 
        email, error 
      });
    }
  },

  sendWelcome: async (email: string, name: string): Promise<void> => {
    try {
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Welcome to Agentic AI Platform',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#7C3AED">You're in, ${name}!</h2>
            <p>Your email has been verified. 
               You can now access the full platform.</p>
            <a href="${FRONTEND_URL}/dashboard"
               style="display:inline-block;background:#7C3AED;color:#fff;
                      padding:12px 24px;border-radius:8px;
                      text-decoration:none;font-weight:bold;margin:16px 0">
              Go to Dashboard
            </a>
            <p>Here's what you can do:</p>
            <ul style="color:#444;line-height:1.8">
              <li>🤖 Create and deploy AI agents</li>
              <li>🛒 Browse the agent marketplace</li>
              <li>💰 Stake tokens to earn rewards</li>
              <li>🖥️ Register compute nodes</li>
              <li>🗳️ Participate in governance</li>
            </ul>
          </div>
        `,
      });
    } catch (error) {
      logger.error('Failed to send welcome email', { email, error });
    }
  },

  // Verify SMTP connection on startup
  verifyConnection: async (): Promise<boolean> => {
    try {
      await transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.warn('SMTP connection failed — emails disabled', { error });
      return false;
    }
  },
};
