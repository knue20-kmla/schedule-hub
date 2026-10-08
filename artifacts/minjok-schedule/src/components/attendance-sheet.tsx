import { X } from 'lucide-react';
import { STATUSES, statusOf, type EntryInfo, type Records, type SessionInfo, type Status } from '@/lib/attendance';
import type { Group } from '@/lib/timetable';

type Props = {
  session: SessionInfo;
  dateLabel: string;
  groups: Group[];
  rosterLoaded: boolean;
  records: Records;
  onToggle: (entry: EntryInfo, status: Status) => void;
  onClear: () => void;
  onClose: () => void;
};

const STATUS_CLASS: Record<Status, string> = { 지각: 'late', 결석: 'absent', 조퇴: 'leave' };

export function AttendanceSheet({ session, dateLabel, groups, rosterLoaded, records, onToggle, onClear, onClose }: Props) {
  const total = groups.reduce((sum, group) => sum + group.students.length, 0);
  const counts: Record<Status, number> = { 지각: 0, 결석: 0, 조퇴: 0 };
  groups.forEach((group) => group.students.forEach((student) => {
    const status = statusOf(records, session, group.label, student) as Status;
    if (status in counts) counts[status] += 1;
  }));
  const marked = counts.지각 + counts.결석 + counts.조퇴;

  return (
    <div className="is-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="is-modal is-sheet" role="dialog" aria-label={`${session.period}교시 출결`} data-testid="sheet-attendance">
        <div className="is-modal-head">
          <div>
            <h2 className="is-modal-title">{session.period}교시 · {session.label}</h2>
            <p className="is-sheet-sub">{dateLabel}{total ? ` · 수강생 ${total}명` : ''}</p>
          </div>
          <button type="button" className="is-close" aria-label="닫기" onClick={onClose} data-testid="button-close-attendance"><X size={17} /></button>
        </div>
        <div className="is-sheet-body">
          {total > 0 && (
            <div className="is-att-summary" aria-label="출결 요약">
              <div><span>전체</span><strong>{total}</strong></div>
              {STATUSES.map((status) => <div key={status} className={STATUS_CLASS[status]}><span>{status}</span><strong data-testid={`count-${status}`}>{counts[status]}</strong></div>)}
            </div>
          )}
          {groups.map((group) => (
            <section key={group.label} className="is-att-group">
              <h3 className="is-att-group-title">{group.label} · {group.students.length}명</h3>
              {group.students.map((student) => {
                const current = statusOf(records, session, group.label, student);
                return (
                  <div className="is-att-row" key={student} data-testid={`student-${student}`}>
                    <span className="is-att-name">{student}</span>
                    <div className="is-att-buttons">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`is-att-btn ${STATUS_CLASS[status]}${current === status ? ' active' : ''}`}
                          aria-pressed={current === status}
                          aria-label={`${student} ${status}`}
                          onClick={() => onToggle({ section: group.label, subject: group.subject, student }, status)}
                        >{status}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
          {!total && <div className="is-empty-filter" data-testid="status-no-roster">{rosterLoaded ? '이 수업은 시트에 수강생 명단이 없어요.' : '학생 명단은 시트를 불러온 뒤에 볼 수 있어요. 인터넷 연결을 확인해 주세요.'}</div>}
          {total > 0 && <p className="is-modal-hint">기록하지 않은 학생은 출석으로 봐요. 같은 버튼을 다시 누르면 취소돼요. 기존 시간표·출결부 앱과 같은 기록을 써요.</p>}
          {marked > 0 && <button type="button" className="is-att-clear" onClick={onClear} data-testid="button-clear-attendance">이 수업 출결 기록 모두 지우기</button>}
        </div>
      </section>
    </div>
  );
}
