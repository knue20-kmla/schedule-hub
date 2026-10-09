import { useState } from 'react';
import { X } from 'lucide-react';
import {
  RECOGNITIONS, STATUSES, recognitionOf, statusOf,
  type EntryInfo, type Recognition, type Records, type SessionInfo, type Status,
} from '@/lib/attendance';
import type { Group } from '@/lib/timetable';

type Props = {
  session: SessionInfo;
  dateLabel: string;
  groups: Group[];
  rosterLoaded: boolean;
  failedRosters?: string[];
  onRetryRoster?: () => void;
  records: Records;
  onToggle: (entry: EntryInfo, status: Status, recognition: Recognition) => void;
  onClear: () => void;
  onClose: () => void;
};

const STATUS_CLASS: Record<Status, string> = { 지각: 'late', 결석: 'absent', 조퇴: 'leave' };
const MODE_KEY = 'minjok-schedule.att-recognition.v1';
const readMode = (): Recognition => { try { return localStorage.getItem(MODE_KEY) === '인정' ? '인정' : '미인정'; } catch { return '미인정'; } };

export function AttendanceSheet({ session, dateLabel, groups, rosterLoaded, failedRosters, onRetryRoster, records, onToggle, onClear, onClose }: Props) {
  // The upper level (미인정 / 인정) is chosen first; the 지각·결석·조퇴 buttons then save with that choice.
  const [mode, setMode] = useState<Recognition>(readMode);
  const chooseMode = (next: Recognition) => { setMode(next); try { localStorage.setItem(MODE_KEY, next); } catch { /* Optional. */ } };

  const total = groups.reduce((sum, group) => sum + group.students.length, 0);
  const counts: Record<Status, number> = { 지각: 0, 결석: 0, 조퇴: 0 };
  const byRecognition: Record<Recognition, number> = { 미인정: 0, 인정: 0 };
  groups.forEach((group) => group.students.forEach((student) => {
    const status = statusOf(records, session, group.label, student) as Status;
    if (status in counts) {
      counts[status] += 1;
      const recognition = recognitionOf(records, session, group.label, student) as Recognition;
      if (recognition in byRecognition) byRecognition[recognition] += 1;
    }
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
            <>
              <div className="is-att-summary" aria-label="출결 요약">
                <div><span>전체</span><strong>{total}</strong></div>
                {STATUSES.map((status) => <div key={status} className={STATUS_CLASS[status]}><span>{status}</span><strong data-testid={`count-${status}`}>{counts[status]}</strong></div>)}
              </div>
              {marked > 0 && <p className="is-att-recog-summary" data-testid="text-recognition-summary">미인정 {byRecognition.미인정}명 · 인정 {byRecognition.인정}명</p>}
              <div className="is-att-mode" role="group" aria-label="인정 구분">
                <span className="is-att-mode-label">구분</span>
                {RECOGNITIONS.map((item) => (
                  <button key={item} type="button" className={`is-att-mode-btn${mode === item ? ' active' : ''}${item === '인정' ? ' yes' : ' no'}`} aria-pressed={mode === item} onClick={() => chooseMode(item)} data-testid={`mode-${item}`}>{item}</button>
                ))}
              </div>
              <p className="is-att-mode-hint">먼저 구분을 고르고 지각·결석·조퇴를 누르면 "{mode} 결석"처럼 저장돼요.</p>
            </>
          )}
          {groups.map((group) => (
            <section key={group.label} className="is-att-group">
              <h3 className="is-att-group-title">{group.label} · {group.students.length}명</h3>
              {group.students.map((student) => {
                const current = statusOf(records, session, group.label, student);
                const recognition = recognitionOf(records, session, group.label, student);
                return (
                  <div className="is-att-row" key={student} data-testid={`student-${student}`}>
                    <span className="is-att-name">
                      {student}
                      {current && <span className={`is-att-tag${recognition === '인정' ? ' yes' : recognition === '미인정' ? ' no' : ''}`} data-testid={`tag-${student}`}>{recognition ? `${recognition} ${current}` : current}</span>}
                    </span>
                    <div className="is-att-buttons">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`is-att-btn ${STATUS_CLASS[status]}${current === status ? ' active' : ''}`}
                          aria-pressed={current === status}
                          aria-label={`${student} ${mode} ${status}`}
                          onClick={() => onToggle({ section: group.label, subject: group.subject, student }, status, mode)}
                        >{status}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
          {!total && (
            <div className="is-empty-filter" data-testid="status-no-roster">
              {failedRosters?.length
                ? `명단 시트(${failedRosters.join(', ')})를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 불러와 주세요.`
                : rosterLoaded ? '이 수업은 시트에 수강생 명단이 없어요.' : '학생 명단은 시트를 불러온 뒤에 볼 수 있어요. 인터넷 연결을 확인해 주세요.'}
              {(failedRosters?.length || !rosterLoaded) && onRetryRoster ? <button type="button" className="is-timetable-retry" style={{ marginTop: 10 }} onClick={onRetryRoster} data-testid="button-roster-retry">명단 다시 불러오기</button> : null}
            </div>
          )}
          {total > 0 && <p className="is-modal-hint">기록하지 않은 학생은 출석으로 봐요. 같은 구분으로 같은 버튼을 다시 누르면 취소돼요. 기존 시간표·출결부 앱과 같은 기록을 쓰고, 그 앱에서는 인정/미인정이 아직 표시되지 않아요(지각·결석·조퇴로만 보여요).</p>}
          {marked > 0 && <button type="button" className="is-att-clear" onClick={onClear} data-testid="button-clear-attendance">이 수업 출결 기록 모두 지우기</button>}
        </div>
      </section>
    </div>
  );
}
