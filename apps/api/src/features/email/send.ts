import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { db } from '../../db/client';
import { emailLog } from '../../db/schema/system';
import type { EmailContent } from './layout';

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  connectionTimeout: 8000,
  socketTimeout: 12_000,
});

export interface Recipient {
  email: string;
  userId?: string;
}

/**
 * Sends one email and records the attempt. It never throws: a mail server
 * that is down must not turn a successful sign-up into an error.
 */
export async function sendEmail(to: Recipient, template: string, content: EmailContent): Promise<boolean> {
  let error: string | null = null;
  try {
    await transport.sendMail({
      from: env.MAIL_FROM,
      to: to.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  await db.insert(emailLog).values({
    userId: to.userId ?? null,
    toEmail: to.email,
    template,
    subject: content.subject,
    status: error ? 'failed' : 'sent',
    error,
  });
  return error === null;
}

/** For mail that is a side effect of a request: do not make the response wait for SMTP. */
export function sendEmailInBackground(to: Recipient, template: string, content: EmailContent): void {
  void sendEmail(to, template, content).catch(() => undefined);
}
