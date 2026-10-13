import { useState } from 'react';
import { statusLabel, type Work } from './api';
import './classroom.css';
import { date } from './format';

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="class-empty">
      <span>𝄞</span>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

export default function WorkList({
  works,
  teacher,
  open,
}: {
  works: Work[];
  teacher: boolean;
  open: (work: Work) => void;
}) {
  const [status, setStatus] = useState('ALL');
  const [student, setStudent] = useState('ALL');
  const students = [...new Map(works.map((work) => [work.student.id, work.student])).values()];
  const shown = works.filter(
    (work) =>
      (status === 'ALL' || work.status === status) &&
      (student === 'ALL' || work.student.id === Number(student)),
  );
  return works.length ? (
    <>
      <div className="class-work-filters">
        <label>
          Статус
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Все работы</option>
            {[...new Set(works.map((work) => work.status))].map((s) => (
              <option value={s} key={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        {teacher && students.length > 1 && (
          <label>
            Ученик
            <select value={student} onChange={(e) => setStudent(e.target.value)}>
              <option value="ALL">Все ученики</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!shown.length && <p>По этим условиям работ нет.</p>}
      <div className="class-work-list">
        {shown.map((work) => (
          <button key={work.id} onClick={() => open(work)}>
            <span className={`class-badge ${work.status.toLowerCase()}`}>
              {statusLabel[work.status]}
            </span>
            <div>
              <h4>{work.definition.title}</h4>
              <small>
                {teacher ? work.student.displayName : work.teacher.displayName} ·{' '}
                {work.dueDate ? `До ${date(work.dueDate + 'T12:00:00')}` : 'Без срока'}
              </small>
            </div>
            <span>Открыть →</span>
          </button>
        ))}
      </div>
    </>
  ) : (
    <Empty
      title={teacher ? 'Здесь пока нет работ' : 'Заданий от преподавателя пока нет'}
      text={
        teacher
          ? 'Создайте шаблон и назначьте его ученику или целой группе.'
          : 'Пока можно заниматься в разделе «Практика Forma».'
      }
    />
  );
}
