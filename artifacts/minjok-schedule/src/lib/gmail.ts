// Gmail access from the browser. The app reads messages and can move one to the Trash (and back); it never
// sends mail, never deletes permanently, and never stores or renders message HTML (bodies become plain text).
// gmail.modify is the narrowest Google scope that allows moving a message to the Trash.
import {
  googleGet, googlePost, readStoredToken as readSlot, requestToken as requestSlot, revokeToken,
  type AccessToken,
} from './google-auth';

const SLOT = 'mailm';
export const MAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';
const SCOPE = MAIL_SCOPE;
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export const readStoredMailToken = () => readSlot(SLOT);
export const requestMailToken = (prompt: '' | 'consent' | 'select_account' = '') => requestSlot(SLOT, SCOPE, prompt);
export const disconnectMail = (token: AccessToken | null) => revokeToken(SLOT, token);

export type MailItem = { id: string; from: string; subject: string; snippet: string; date: number; unread: boolean };
export type MailDetail = MailItem & { to: string; body: string; attachments: string[] };

type Header = { name: string; value: string };
type Part = { mimeType?: string; filename?: string; headers?: Header[]; body?: { data?: string; size?: number }; parts?: Part[] };
type ApiMessage = { id: string; snippet?: string; internalDate?: string; labelIds?: string[]; payload?: Part & { headers?: Header[] } };

const get = <T>(token: AccessToken, path: string, params: Record<string, string | string[]> = {}) => googleGet<T>(SLOT, token, `${API}${path}`, params);
const header = (headers: Header[] | undefined, name: string) => headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

// "홍길동 <a@b.com>" -> "홍길동"; bare address stays as is.
function senderName(value: string) {
  const match = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return (match ? match[1].trim() || match[2] : value).trim() || '(보낸 사람 없음)';
}

function toItem(message: ApiMessage): MailItem {
  const headers = message.payload?.headers;
  return {
    id: message.id,
    from: senderName(header(headers, 'From')),
    subject: header(headers, 'Subject').trim() || '(제목 없음)',
    snippet: (message.snippet ?? '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
    date: Number(message.internalDate ?? 0),
    unread: Boolean(message.labelIds?.includes('UNREAD')),
  };
}

export async function listInbox(token: AccessToken, options: { unreadOnly: boolean; max?: number }): Promise<MailItem[]> {
  const list = await get<{ messages?: { id: string }[] }>(token, '/messages', {
    labelIds: 'INBOX', maxResults: String(options.max ?? 25), ...(options.unreadOnly ? { q: 'is:unread' } : {}),
  });
  const messages = await Promise.all((list.messages ?? []).map((m) => get<ApiMessage>(token, `/messages/${m.id}`, {
    format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'],
  })));
  return messages.map(toItem).sort((a, b) => b.date - a.date);
}

// Moves to the Trash (recoverable for 30 days in Gmail). Not a permanent delete.
export const trashMail = (token: AccessToken, id: string) => googlePost<unknown>(SLOT, token, `${API}/messages/${id}/trash`);
export const untrashMail = (token: AccessToken, id: string) => googlePost<unknown>(SLOT, token, `${API}/messages/${id}/untrash`);

function decode(data: string, charset: string) {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  try { return new TextDecoder(charset || 'utf-8').decode(bytes); } catch { return new TextDecoder('utf-8').decode(bytes); }
}
const charsetOf = (part: Part) => header(part.headers, 'Content-Type').match(/charset="?([\w-]+)"?/i)?.[1] ?? 'utf-8';

function findPart(part: Part, mime: string): Part | null {
  if (part.mimeType === mime && part.body?.data && !part.filename) return part;
  for (const child of part.parts ?? []) { const found = findPart(child, mime); if (found) return found; }
  return null;
}
function collectAttachments(part: Part, names: string[] = []) {
  if (part.filename) names.push(part.filename);
  (part.parts ?? []).forEach((child) => collectAttachments(child, names));
  return names;
}
function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('style,script,head').forEach((node) => node.remove());
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  doc.querySelectorAll('p,div,tr,li,h1,h2,h3,h4').forEach((node) => node.append('\n'));
  return (doc.body.textContent ?? '');
}

export async function getMail(token: AccessToken, id: string): Promise<MailDetail> {
  const message = await get<ApiMessage>(token, `/messages/${id}`, { format: 'full' });
  const payload = message.payload ?? {};
  const plain = findPart(payload, 'text/plain');
  const html = findPart(payload, 'text/html');
  let body = plain ? decode(plain.body!.data!, charsetOf(plain)) : html ? htmlToText(decode(html.body!.data!, charsetOf(html))) : '';
  if (!body && payload.body?.data) {
    const text = decode(payload.body.data, charsetOf(payload));
    body = payload.mimeType === 'text/html' ? htmlToText(text) : text;
  }
  body = body.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { ...toItem(message), to: header(payload.headers, 'To'), body: body || message.snippet || '(본문이 없어요)', attachments: collectAttachments(payload) };
}
