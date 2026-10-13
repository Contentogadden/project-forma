import { useState, type FormEvent } from 'react';
import { api, countWord, type Group, type Template } from './api';
import './classroom.css';
import { errorText } from './format';

export default function AssignPanel({
  template,
  groups,
  close,
  done,
}: {
  template: Template;
  groups: Group[];
  close: () => void;
  done: () => void;
}) {
  const [ids, setIds] = useState<number[]>([]);
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const students = [
    ...new Map(
      groups.flatMap((g) => g.students.filter((s) => s.enabled)).map((s) => [s.id, s]),
    ).values(),
  ];
  const toggle = (id: number) =>
    setIds((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/templates/${template.id}/assign`, 'POST', {
        version: template.version,
        studentIds: ids,
        dueDate: due || null,
      });
      done();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="classroom">
      <button onClick={close} disabled={busy}>
        ← Шаблоны
      </button>
      <div className="class-heading">
        <h3>Назначить задание</h3>
      </div>
      <form className="class-narrow" onSubmit={submit}>
        <h4>{template.definition.title}</h4>
        <p>Каждый ученик получит собственную работу с текущими условиями.</p>
        <div className="class-actions">
          {groups.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() =>
                setIds((old) => [
                  ...new Set([...old, ...g.students.filter((s) => s.enabled).map((s) => s.id)]),
                ])
              }
            >
              ＋ {g.name}
            </button>
          ))}
        </div>
        <fieldset>
          <legend>Ученики ({ids.length})</legend>
          {students.length ? (
            students.map((s) => (
              <label className="class-person" key={s.id}>
                <input type="checkbox" checked={ids.includes(s.id)} onChange={() => toggle(s.id)} />
                {s.displayName}
                <small>@{s.username}</small>
              </label>
            ))
          ) : (
            <p>Нет активных учеников. Попросите администратора добавить группу.</p>
          )}
        </fieldset>
        <label>
          Срок (необязательно)
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        {error && (
          <p className="class-error" role="alert">
            {error}
          </p>
        )}
        <div className="class-actions">
          <button className="class-primary" disabled={busy || !ids.length}>
            {busy
              ? 'Назначаем…'
              : `Выдать ${ids.length} ${countWord(ids.length, 'ученику', 'ученикам', 'ученикам')}`}
          </button>
        </div>
      </form>
    </section>
  );
}
