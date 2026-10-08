import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Mail, Paperclip, RefreshCw, X } from 'lucide-react';
import { AuthError, type AccessToken } from '@/lib/google-auth';
import { getMail, listInbox, type MailDetail, type MailItem } from '@/lib/gmail';

type Props = {
  token: AccessToken | null;
  connecting: boolean;
  onConnect: () => void;
  onExpired: () => void;
  onClose: () => void;
};

function formatDate(ms: number) {
  if (!ms) return '';
  const date = new Date(ms);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  const sameYear = date.getFullYear() === now.getFullYear();
  return `${sameYear ? '' : `${date.getFullYear()}년 `}${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function MailSheet({ token, connecting, onConnect, onExpired, onClose }: Props) {
  const [items, setItems] = useState<MailItem[] | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MailDetail | null>(null);

  const fail = useCallback((err: unknown) => {
    if (err instanceof AuthError) { onExpired(); return; }
    const reason = err instanceof Error ? err.message : '';
    setError(reason === 'google_403' ? 'Gmail 사용 권한이 없어요. Google Cloud에서 Gmail API를 켜고 gmail.readonly 범위를 추가했는지 확인해 주세요.' : '메일을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
  }, [onExpired]);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError('');
    try { setItems(await listInbox(token, { unreadOnly })); } catch (err) { fail(err); } finally { setBusy(false); }
  }, [token, unreadOnly, fail]);

  useEffect(() => { void load(); }, [load]);

  async function open(id: string) {
    if (!token) return;
    setOpenId(id);
    setDetail(null);
    setError('');
    try { setDetail(await getMail(token, id)); } catch (err) { fail(err); setOpenId(null); }
  }

  const unreadCount = items?.filter((item) => item.unread).length ?? 0;

  return (
    <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="is-modal is-sheet" role="dialog" aria-label="메일" data-testid="sheet-mail">
        <div className="is-modal-head">
          {openId
            ? <button type="button" className="is-close" aria-label="목록으로" onClick={() => { setOpenId(null); setDetail(null); }} data-testid="button-mail-back"><ArrowLeft size={17} /></button>
            : <div><h2 className="is-modal-title">받은 메일</h2>{items && <p className="is-sheet-sub">{unreadOnly ? '안 읽은 메일' : `최근 ${items.length}통`} · 안 읽음 {unreadCount}통</p>}</div>}
          <div className="is-mail-actions">
            {!openId && token && <button type="button" className="is-refresh" onClick={() => void load()} disabled={busy} aria-label="메일 새로고침" data-testid="button-mail-refresh"><RefreshCw size={14} className={busy ? 'is-spin' : undefined} /></button>}
            <button type="button" className="is-close" aria-label="닫기" onClick={onClose} data-testid="button-close-mail"><X size={17} /></button>
          </div>
        </div>

        <div className="is-sheet-body">
          {!token && (
            <div className="is-mail-connect">
              <Mail size={28} strokeWidth={1.5} />
              <p>Gmail을 연결하면 받은편지함의 메일을 읽을 수 있어요.<br />읽기만 하고, 보내거나 지우거나 읽음 표시를 바꾸지 않아요.</p>
              <button type="button" className="is-modal-submit" onClick={onConnect} disabled={connecting} data-testid="button-mail-connect">{connecting ? '연결 중…' : 'Gmail 연결'}</button>
            </div>
          )}

          {token && !openId && (
            <>
              <div className="is-mail-filter" role="group" aria-label="메일 보기">
                <button type="button" className={`is-category-choice${!unreadOnly ? ' active' : ''}`} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>전체</button>
                <button type="button" className={`is-category-choice${unreadOnly ? ' active' : ''}`} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>안 읽음</button>
              </div>
              {error && <div className="is-empty-filter" role="alert" data-testid="status-mail-error">{error}</div>}
              {!error && items === null && <div className="is-empty-filter">메일을 불러오는 중이에요…</div>}
              {!error && items?.length === 0 && <div className="is-empty-filter" data-testid="status-no-mail">{unreadOnly ? '안 읽은 메일이 없어요.' : '받은 메일이 없어요.'}</div>}
              <div className="is-mail-list">
                {items?.map((item) => (
                  <button type="button" key={item.id} className={`is-mail-row${item.unread ? ' unread' : ''}`} onClick={() => void open(item.id)} data-testid={`mail-${item.id}`}>
                    <span className="is-mail-top"><span className="is-mail-from">{item.from}</span><span className="is-mail-date">{formatDate(item.date)}</span></span>
                    <span className="is-mail-subject">{item.subject}</span>
                    <span className="is-mail-snippet">{item.snippet}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {token && openId && (
            <article className="is-mail-detail" data-testid="mail-detail">
              {!detail && !error && <div className="is-empty-filter">메일을 여는 중이에요…</div>}
              {error && <div className="is-empty-filter" role="alert">{error}</div>}
              {detail && (
                <>
                  <h3 className="is-mail-detail-subject">{detail.subject}</h3>
                  <p className="is-mail-meta"><strong>{detail.from}</strong> · {new Date(detail.date).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  {detail.to && <p className="is-mail-meta">받는 사람: {detail.to}</p>}
                  <pre className="is-mail-body">{detail.body}</pre>
                  {detail.attachments.length > 0 && <p className="is-mail-attach"><Paperclip size={13} /> 첨부파일 {detail.attachments.length}개: {detail.attachments.join(', ')} <span>(여기서는 열 수 없어요)</span></p>}
                </>
              )}
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
