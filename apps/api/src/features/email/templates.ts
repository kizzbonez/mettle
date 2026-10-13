import { env } from '../../config/env';
import { escapeHtml, renderHtml, renderText, type EmailBody, type EmailContent } from './layout';

/** Each template takes plain data and returns subject, HTML and a text alternative. */

function build(siteName: string, subject: string, body: EmailBody): EmailContent {
  return { subject, html: renderHtml(siteName, body), text: renderText(siteName, body) };
}

const link = (path: string) => `${env.PUBLIC_ORIGIN}${path}`;

export function welcomeEmail(siteName: string, name: string): EmailContent {
  return build(siteName, `Welcome to ${siteName}`, {
    preview: 'Your account is ready. Pick a track and start your first lab.',
    heading: `Welcome, ${name}.`,
    paragraphs: [
      `Your ${escapeHtml(siteName)} account is ready.`,
      'Pick a track, read the first lesson, and take the mock exam when you feel ready. Every level ends with a hands-on lab: you write real code, and it is run against test cases in a sandbox.',
      'Progress is saved as you go, so you can stop and pick up where you left off.',
    ],
    action: { label: 'Go to your dashboard', url: link('/dashboard') },
    footnote: 'You are receiving this because an account was created with this email address.',
  });
}

export function passwordResetEmail(siteName: string, name: string, token: string): EmailContent {
  return build(siteName, `Reset your ${siteName} password`, {
    preview: 'Use this link to choose a new password. It works once and expires in one hour.',
    heading: 'Reset your password',
    paragraphs: [
      `Hi ${escapeHtml(name)}, we received a request to reset the password for this account.`,
      'The link below works <strong>once</strong> and expires in <strong>one hour</strong>.',
    ],
    action: { label: 'Choose a new password', url: link(`/reset-password?token=${encodeURIComponent(token)}`) },
    footnote:
      'If you did not ask for this, you can ignore this email. Your password stays the same, and nobody can reset it without access to this inbox.',
  });
}

export function passwordChangedEmail(siteName: string, name: string): EmailContent {
  return build(siteName, `Your ${siteName} password was changed`, {
    preview: 'This is a confirmation that your password was changed.',
    heading: 'Your password was changed',
    paragraphs: [
      `Hi ${escapeHtml(name)}, the password for your account was just changed, and every other device was signed out.`,
      'If this was you, there is nothing more to do.',
    ],
    action: { label: 'Reset my password', url: link('/forgot-password') },
    footnote: 'If this was <strong>not</strong> you, reset your password now using the button above.',
  });
}

/** A message an administrator wrote to a user. The body is plain text. */
export function adminMessageEmail(siteName: string, name: string, subject: string, message: string): EmailContent {
  const paragraphs = message
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block.trim()).replace(/\n/g, '<br>'))
    .filter(Boolean);
  return build(siteName, subject, {
    preview: message.slice(0, 120),
    heading: subject,
    paragraphs: [`Hi ${escapeHtml(name)},`, ...paragraphs],
    footnote: `This message was sent to you by the ${escapeHtml(siteName)} team.`,
  });
}

export function accountSuspendedEmail(siteName: string, name: string, reason: string): EmailContent {
  return build(siteName, `Your ${siteName} account has been suspended`, {
    preview: 'Your account can no longer sign in.',
    heading: 'Your account has been suspended',
    paragraphs: [
      `Hi ${escapeHtml(name)}, an administrator has suspended your account, and it can no longer sign in.`,
      reason ? `Reason given: <em>${escapeHtml(reason)}</em>` : 'No reason was recorded.',
    ],
    footnote: 'If you believe this is a mistake, reply to this email.',
  });
}
