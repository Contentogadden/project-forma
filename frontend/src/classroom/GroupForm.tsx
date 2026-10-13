import { useState, type FormEvent } from 'react';
import ConfirmLeave from './ConfirmLeave';
import { usePendingChanges } from './PendingChanges';
import { api, type Group, type Person } from './api';
import './classroom.css';
import { errorText } from './format';

export default function GroupForm({
  group,
  users,
  close,
  done,
}: {
  group?: Group;
  users: Person[];
  close: () => void;
  done: () => void;
}) {
  const [name, setName] = useState(group?.name ?? '');
  const [teacher, setTeacher] = useState(group?.teacher.id.toString() ?? '');
  const [ids, setIds] = useState(group?.students.map((s) => s.id) ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty =
    name !== (group?.name ?? '') ||
    teacher !== (group?.teacher.id.toString() ?? '') ||
    JSON.stringify([...ids].sort()) !==
      JSON.stringify((group?.students.map((s) => s.id) ?? []).sort());
  usePendingChanges(dirty || busy);
  const [leaving, setLeaving] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(group ? `/groups/${group.id}` : '/groups', group ? 'PUT' : 'POST', {
        name,
        teacherId: Number(teacher),
        studentIds: ids,
      });
      done();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {leaving && <ConfirmLeave cancel={() => setLeaving(false)} leave={close} />}
      <form className="class-admin-form" onSubmit={submit}>
        <label>
          Название группы
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Преподаватель
          <select required value={teacher} onChange={(e) => setTeacher(e.target.value)}>
            <option value="">Выберите преподавателя</option>
            {users
              .filter((u) => u.role === 'TEACHER')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName}
                  {u.enabled ? '' : ' · отключён'}
                </option>
              ))}
          </select>
        </label>
        <fieldset>
          <legend>Состав группы</legend>
          {users
            .filter((u) => u.role === 'STUDENT')
            .map((s) => (
              <label key={s.id} className="class-person">
                <input
                  type="checkbox"
                  checked={ids.includes(s.id)}
                  onChange={(e) =>
                    setIds(e.target.checked ? [...ids, s.id] : ids.filter((x) => x !== s.id))
                  }
                />
                {s.displayName}
                {s.enabled ? '' : ' · вход отключён'}
              </label>
            ))}
        </fieldset>
        <p className="class-help">
          Изменение состава влияет на новые назначения. Уже выданные работы и их авторы сохраняются.
        </p>
        <div className="class-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => (dirty ? setLeaving(true) : close())}
          >
            Отмена
          </button>
          <button className="class-primary" disabled={busy}>
            {busy ? 'Сохраняем…' : 'Сохранить группу'}
          </button>
        </div>
        {error && (
          <p className="class-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
