import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendViaResend(data: EmailData): Promise<void> {
  if (!resend) throw new Error('Resend not configured');
  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text
  });
}

async function sendViaSMTP(data: EmailData): Promise<void> {
  if (!process.env.SMTP_HOST) throw new Error('SMTP not configured');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: FROM,
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text,
  });
}

async function sendWithFailover(data: EmailData): Promise<void> {
  // 1. Try Resend
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(data);
      logger.info('Email sent successfully via Resend', { to: data.to, subject: data.subject });
      return;
    } catch (error: any) {
      logger.warn('Resend failed, trying SMTP fallback', { error: error.message, to: data.to });
    }
  }

  // 2. Try SMTP
  if (process.env.SMTP_HOST) {
    try {
      await sendViaSMTP(data);
      logger.info('Email sent successfully via SMTP', { to: data.to, subject: data.subject });
      return;
    } catch (error: any) {
      logger.error('SMTP fallback failed', { error: error.message, to: data.to });
    }
  }

  // 3. Console fallback (Dev/Emergency)
  logger.warn('ALL email providers failed or not configured — logging email to console', {
    to: data.to,
    subject: data.subject,
    text: data.text
  });
}

const wrapTemplate = (content: string, ctaText?: string, ctaLink?: string) => `
  <div style="background-color: #0A0A0A; color: #FFFFFF; font-family: system-ui, -apple-system, sans-serif; padding: 40px 20px; line-height: 1.6;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #111111; border: 1px solid #1E1E1E; border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="margin-bottom: 32px;">
        <span style="font-size: 24px; font-weight: 800; letter-spacing: -1px;">Agentic<span style="color: #7C3AED;">AI</span></span>
      </div>
      
      ${content}
      
      ${ctaText && ctaLink ? `
        <div style="margin-top: 32px;">
          <a href="${ctaLink}" style="display: inline-block; background-color: #7C3AED; color: #FFFFFF; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; transition: all 0.2s;">
            ${ctaText}
          </a>
        </div>
      ` : ''}
      
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1E1E1E; color: #666666; font-size: 12px; text-align: center;">
        AgenticAI — The Infrastructure Layer for the AI Agent Economy
      </div>
    </div>
  </div>
`;

export const EmailService = {
  sendVerification: async (email: string, name: string, token: string): Promise<void> => {
    const url = `${FRONTEND_URL}/auth/verify-email?token=${token}`;
    const subject = "Verify your AgenticAI account";
    const html = wrapTemplate(`
      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Verify your email</h1>
      <p style="color: #A0A0A0; font-size: 16px; margin-bottom: 24px;">Hi ${name}, welcome to the autonomous economy. Please verify your email to activate your account.</p>
    `, "Verify Email", url);

    await sendWithFailover({
      to: email,
      subject,
      html,
      text: `Verify your AgenticAI account: ${url}`
    });
  },

  sendPasswordReset: async (email: string, name: string, token: string): Promise<void> => {
    const url = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
    const subject = "Reset your AgenticAI password";
    const html = wrapTemplate(`
      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Reset password</h1>
      <p style="color: #A0A0A0; font-size: 16px; margin-bottom: 24px;">Hi ${name}, we received a request to reset your password. This link will expire in 1 hour.</p>
    `, "Reset Password", url);

    await sendWithFailover({
      to: email,
      subject,
      html,
      text: `Reset your AgenticAI password: ${url}`
    });
  },

  sendWelcome: async (email: string, name: string): Promise<void> => {
    const subject = "Welcome to AgenticAI — you're in!";
    const html = wrapTemplate(`
      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">You're in, ${name}!</h1>
      <p style="color: #A0A0A0; font-size: 16px; margin-bottom: 24px;">Your account is verified. Here are 5 things you can do right now:</p>
      <ul style="color: #A0A0A0; font-size: 14px; padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;">🤖 Create and deploy your first AI agent</li>
        <li style="margin-bottom: 8px;">🛒 Browse high-performance agents in the Marketplace</li>
        <li style="margin-bottom: 8px;">💰 Stake AGNT tokens to earn protocol rewards</li>
        <li style="margin-bottom: 8px;">🖥️ Register a compute node to power the network</li>
        <li style="margin-bottom: 8px;">🗳️ Vote on governance proposals</li>
      </ul>
    `, "Go to Dashboard", `${FRONTEND_URL}/dashboard`);

    await sendWithFailover({
      to: email,
      subject,
      html,
      text: `Welcome to AgenticAI, ${name}! Your account is verified.`
    });
  },

  verifyConnection: async (): Promise<boolean> => {
    if (process.env.RESEND_API_KEY) {
      logger.info('Resend email service configured');
    }
    if (process.env.SMTP_HOST) {
      logger.info('SMTP email fallback configured');
    }
    if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
      logger.info('No email service configured — emails will be logged to console only');
    }
    return true;
  }
};

