import { useState, type FormEvent } from 'react';
import { usePendingChanges } from './PendingChanges';
import { api } from './api';
import './classroom.css';
import { errorText } from './format';

export default function UserForm({ done }: { done: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  usePendingChanges(dirty || busy);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api('/users', 'POST', Object.fromEntries(f));
      done();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="class-admin-form" onSubmit={submit} onChange={() => setDirty(true)}>
      <label>
        Имя
        <input name="displayName" required maxLength={120} />
      </label>
      <label>
        Логин
        <input
          name="username"
          required
          pattern="[a-zA-Z0-9._\-]{3,64}"
          autoComplete="off"
          placeholder="Латиница, от 3 символов"
        />
      </label>
      <label>
        Пароль
        <input
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={64}
          autoComplete="new-password"
          placeholder="Не меньше 12 символов"
        />
      </label>
      <label>
        Роль
        <select name="role">
          <option value="STUDENT">Ученик</option>
          <option value="TEACHER">Преподаватель</option>
          <option value="ADMIN">Администратор</option>
        </select>
      </label>
      <button className="class-primary" disabled={busy}>
        {busy ? 'Создаём…' : 'Создать учётную запись'}
      </button>
      {error && (
        <p className="class-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
