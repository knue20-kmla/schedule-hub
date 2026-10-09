import { useState } from 'react';
import { ArrowLeft, Plus, StickyNote, Trash2, X } from 'lucide-react';
import { newestFirst, type Memo } from '@/lib/memos';

type Props = {
  memos: Memo[];
  undo: Memo | null;
  onSave: (id: number | null, text: string) => boolean;
  onDelete: (id: number) => void;
  onUndo: () => void;
  onClose: () => void;
};

function formatWhen(ms: number) {
  if (!ms) return '';
  const date = new Date(ms);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}`;
}

export function MemoSheet({ memos, undo, onSave, onDelete, onUndo, onClose }: Props) {
  // null = list view; { id: null } = writing a new memo; { id } = editing an existing one.
  const [editing, setEditing] = useState<{ id: number | null; text: string } | null>(null);
  const list = newestFirst(memos);

  function save() {
    if (!editing) return;
    if (onSave(editing.id, editing.text)) setEditing(null);
  }

  return (
    <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="is-modal is-sheet" role="dialog" aria-label="메모" data-testid="sheet-memo">
        <div className="is-modal-head">
          {editing
            ? <button type="button" className="is-close" aria-label="목록으로" onClick={() => setEditing(null)} data-testid="button-memo-back"><ArrowLeft size={17} /></button>
            : <div><h2 className="is-modal-title">나만 보는 메모</h2><p className="is-sheet-sub">메모 {memos.length}개</p></div>}
          <button type="button" className="is-close" aria-label="닫기" onClick={onClose} data-testid="button-close-note"><X size={17} /></button>
        </div>

        <div className="is-sheet-body">
          {undo && (
            <div className="is-mail-undo" role="status" data-testid="status-memo-deleted">
              <span>메모를 삭제했어요</span>
              <button type="button" onClick={onUndo} data-testid="button-undo-memo">되돌리기</button>
            </div>
          )}

          {editing ? (
            <form onSubmit={(event) => { event.preventDefault(); save(); }}>
              <textarea className="is-textarea" autoFocus aria-label="메모 내용" data-testid="input-note-content" value={editing.text} onChange={(event) => setEditing({ ...editing, text: event.target.value })} placeholder="기억해둘 일을 적어보세요" />
              <p className="is-modal-hint">메모는 이 기기에 저장되고, 동기화를 켜면 다른 기기와도 맞춰져요.</p>
              <button type="submit" className="is-modal-submit" data-testid="button-save-note"><StickyNote size={14} /> {editing.id === null ? '메모 추가하기' : '메모 저장하기'}</button>
            </form>
          ) : (
            <>
              <button type="button" className="is-add" onClick={() => setEditing({ id: null, text: '' })} data-testid="button-memo-add"><Plus size={14} /> 새 메모 쓰기</button>
              {list.length === 0 && <div className="is-empty-filter" data-testid="status-no-memo">아직 메모가 없어요. 새 메모를 써 보세요.</div>}
              <div className="is-memo-list">
                {list.map((memo) => (
                  <div className="is-memo-item" key={memo.id} data-testid={`memo-item-${memo.id}`}>
                    <button type="button" className="is-memo-open" onClick={() => setEditing({ id: memo.id, text: memo.text })} aria-label="메모 열기">
                      <span className="is-memo-text">{memo.text}</span>
                      {memo.updatedAt > 0 && <span className="is-memo-when">{formatWhen(memo.updatedAt)}</span>}
                    </button>
                    <button type="button" className="is-mail-trash" onClick={() => onDelete(memo.id)} aria-label="메모 삭제" data-testid={`button-delete-memo-${memo.id}`}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
