import { useState } from 'react';
import { AutoCheck } from './AutoCheck';
import ConfirmLeave from './ConfirmLeave';
import MelodyEditor from './MelodyEditor';
import { usePendingChanges } from './PendingChanges';
import { api, statusLabel, type Status, type Work } from './api';
import './classroom.css';
import { date, errorText } from './format';

export default function WorkPanel({
  initial,
  teacher,
  close,
}: {
  initial: Work;
  teacher: boolean;
  close: () => void;
}) {
  const [work, setWork] = useState(initial);
  const [notes, setNotes] = useState(initial.notes);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const editable = !teacher && ['NOT_STARTED', 'DRAFT', 'REVISION'].includes(work.status);
  const dirty = notes.join() !== work.notes.join();
  usePendingChanges(dirty || busy || (teacher && work.status === 'SUBMITTED' && !!comment.trim()));
  const [leaving, setLeaving] = useState(false);
  async function answer(submit: boolean) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next = await api<Work>(`/works/${work.id}/answer`, 'PUT', {
        version: work.version,
        notes,
        submit,
      });
      setWork(next);
      setNotes(next.notes);
      setNotice(submit ? 'Отправлено преподавателю' : 'Черновик сохранён · ещё не отправлен');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function review(status: Status) {
    if (!comment.trim()) return;
    setBusy(true);
    setError('');
    try {
      const next = await api<Work>(`/works/${work.id}/review`, 'POST', {
        version: work.version,
        status,
        comment,
      });
      setWork(next);
      setNotice(status === 'ACCEPTED' ? 'Работа принята.' : 'Работа возвращена ученику.');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="classroom">
      {leaving && <ConfirmLeave cancel={() => setLeaving(false)} leave={close} />}
      <button
        disabled={busy}
        onClick={() =>
          dirty || (teacher && work.status === 'SUBMITTED' && !!comment.trim())
            ? setLeaving(true)
            : close()
        }
      >
        ← Список работ
      </button>
      <div className="class-heading">
        <div>
          <span className={`class-badge ${work.status.toLowerCase()}`}>
            {statusLabel[work.status]}
          </span>
          <h3>{work.definition.title}</h3>
          <p>
            {teacher ? work.student.displayName : work.teacher.displayName}
            {work.dueDate ? ` · До ${date(work.dueDate + 'T12:00:00')}` : ''}
          </p>
        </div>
      </div>
      <div className="class-answer">
        <div className="class-score-panel">
          <p>{work.definition.instruction}</p>
          <MelodyEditor
            key={`${work.id}-${editable}`}
            definition={work.definition}
            notes={notes}
            onChange={busy ? undefined : setNotes}
            readOnly={!editable}
          />
          {work.definition.hint && (
            <details>
              <summary>Подсказка</summary>
              <p>{work.definition.hint}</p>
            </details>
          )}
          <AutoCheck work={work} notes={notes} />
        </div>
        <aside className="class-review">
          <h4>{teacher ? 'Обратная связь' : 'От преподавателя'}</h4>
          {work.comment ? <blockquote>{work.comment}</blockquote> : <p>Отзыва пока нет.</p>}
          {teacher && work.status === 'SUBMITTED' && (
            <>
              <label>
                Комментарий
                <textarea
                  maxLength={2000}
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Что получилось и что стоит услышать иначе?"
                />
              </label>
              <div className="class-actions">
                <button disabled={busy || !comment.trim()} onClick={() => review('REVISION')}>
                  На доработку
                </button>
                <button
                  className="class-primary"
                  disabled={busy || !comment.trim()}
                  onClick={() => review('ACCEPTED')}
                >
                  Принять
                </button>
              </div>
            </>
          )}
          {!teacher && editable && (
            <div className="class-actions">
              <button disabled={busy} onClick={() => answer(false)}>
                Сохранить черновик
              </button>
              <button
                className="class-primary"
                disabled={busy || work.definition.editable.some((i) => !notes[i])}
                onClick={() => answer(true)}
              >
                Отправить учителю →
              </button>
            </div>
          )}
          {!teacher && !editable && (
            <p>
              Ответ сохранён и доступен преподавателю. Редактирование откроется при возврате на
              доработку.
            </p>
          )}
          {dirty && <small>Есть несохранённые изменения</small>}
          {error && (
            <p className="class-error" role="alert">
              {error}
            </p>
          )}
          <p role="status">{busy ? 'Сохраняем…' : notice}</p>
        </aside>
      </div>
      {work.history.length > 0 && (
        <details className="class-history">
          <summary>История работы ({work.history.length})</summary>
          {work.history.map((e) => (
            <article key={e.id}>
              <b>
                {statusLabel[e.kind]} · {new Date(e.createdAt).toLocaleString('ru-RU')}
              </b>
              {e.comment && <p>{e.comment}</p>}
              <details>
                <summary>Послушать эту версию</summary>
                <MelodyEditor definition={work.definition} notes={e.notes} readOnly />
              </details>
            </article>
          ))}
        </details>
      )}
    </section>
  );
}
