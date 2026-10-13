/** Reads mail caught by the Mailpit container that `npm run dev:services` starts. */

const MAILPIT = 'http://127.0.0.1:4325/api/v1';

export interface CaughtEmail {
  subject: string;
  text: string;
  html: string;
}

async function findMessageId(address: string, subjectIncludes: string): Promise<string | null> {
  const query = encodeURIComponent(`to:"${address}"`);
  const response = await fetch(`${MAILPIT}/search?query=${query}`);
  const data = (await response.json()) as { messages: { ID: string; Subject: string }[] };
  return data.messages.find((message) => message.Subject.includes(subjectIncludes))?.ID ?? null;
}

/** Waits for an email to `address`; mail is sent after the response, so it can lag. */
export async function waitForEmail(address: string, subjectIncludes = '', timeoutMs = 8000): Promise<CaughtEmail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const id = await findMessageId(address, subjectIncludes);
    if (id) {
      const message = (await (await fetch(`${MAILPIT}/message/${id}`)).json()) as { Subject: string; Text: string; HTML: string };
      return { subject: message.Subject, text: message.Text, html: message.HTML };
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`No email to ${address} matching "${subjectIncludes}" arrived within ${timeoutMs} ms`);
}

export function resetTokenFrom(email: CaughtEmail): string {
  const match = /reset-password\?token=([A-Za-z0-9_%-]+)/.exec(email.text);
  if (!match?.[1]) throw new Error('No reset link in the email');
  return decodeURIComponent(match[1]);
}
