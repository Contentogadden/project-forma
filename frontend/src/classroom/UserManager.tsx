import { useEffect, useState, type FormEvent } from 'react';
import { api, type AuditEvent, type Person, type Role, type Viewer } from './api';
import ConfirmLeave from './ConfirmLeave';
import { usePendingChanges } from './PendingChanges';

const roleNames: Record<Role, string> = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  STUDENT: 'Ученик',
};
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Не удалось сохранить');
export default function UserManager({
  users,
  viewer,
  reload,
}: {
  users: Person[];
  viewer: Viewer;
  reload: () => void;
}) {
  const [selected, setSelected] = useState<Person | null>(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('ALL');
  const shown = users.filter(
    (u) =>
      (role === 'ALL' || u.role === role) &&
      `${u.displayName} ${u.username}`
        .toLocaleLowerCase('ru')
        .includes(query.trim().toLocaleLowerCase('ru')),
  );
  return (
    <>
      <div className="class-user-search">
        <label>
          Поиск
          <input
            type="search"
            placeholder="Имя или логин"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Роль
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ALL">Все</option>
            {Object.entries(roleNames).map(([value, name]) => (
              <option value={value} key={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selected && (
        <UserEditor
          key={selected.id}
          user={selected}
          self={selected.username === viewer.username}
          close={() => setSelected(null)}
          done={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
      <div className="class-user-list">
        {shown.length ? (
          shown.map((u) => (
            <div className="class-person" key={u.id}>
              <b>{u.displayName}</b>
              <span>@{u.username}</span>
              <span className="class-badge">
                {roleNames[u.role]}
                {u.enabled ? '' : ' · отключён'}
              </span>
              <button
                disabled={!!selected}
                aria-label={`Изменить пользователя ${u.displayName}`}
                onClick={() => setSelected(u)}
              >
                Изменить
              </button>
            </div>
          ))
        ) : (
          <p>Пользователей с такими условиями нет.</p>
        )}
      </div>
    </>
  );
}
function UserEditor({
  user,
  self,
  close,
  done,
}: {
  user: Person;
  self: boolean;
  close: () => void;
  done: () => void;
}) {
  const [name, setName] = useState(user.displayName);
  const [role, setRole] = useState(user.role);
  const [enabled, setEnabled] = useState(user.enabled);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'profile' | 'password'>('profile');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const dirty =
    name !== user.displayName || role !== user.role || enabled !== user.enabled || !!password;
  usePendingChanges(dirty || busy);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(
        mode === 'password' ? `/users/${user.id}/password` : `/users/${user.id}`,
        mode === 'password' ? 'POST' : 'PUT',
        mode === 'password'
          ? { version: user.version, password }
          : { version: user.version, displayName: name, role, enabled },
      );
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
      <form onSubmit={save} className="class-admin-form">
        <div className="class-user-editor-heading">
          <h4>{user.displayName}</h4>
          <span>@{user.username}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => (dirty ? setLeaving(true) : close())}
          >
            Закрыть
          </button>
        </div>
        <div className="class-tabs">
          <button
            type="button"
            aria-pressed={mode === 'profile'}
            onClick={() => setMode('profile')}
          >
            Данные и доступ
          </button>
          <button
            type="button"
            disabled={self}
            aria-pressed={mode === 'password'}
            onClick={() => setMode('password')}
          >
            Новый пароль
          </button>
        </div>
        {mode === 'profile' ? (
          <>
            <label>
              Имя
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Роль
              <select
                value={role}
                disabled={self}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {Object.entries(roleNames).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="class-check-row">
              <input
                type="checkbox"
                disabled={self}
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Вход разрешён
            </label>
            <p className="class-help">
              При отключении входа текущие сессии завершатся. Группы и работы сохранятся. Роль
              аккаунта с учебными работами изменить нельзя.
            </p>
          </>
        ) : (
          <>
            <label>
              Новый пароль
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={64}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Не меньше 12 символов"
              />
            </label>
            <p className="class-help">
              Передайте новый пароль пользователю лично. Прежний пароль перестанет работать,
              открытые сессии завершатся.
            </p>
          </>
        )}
        <div className="class-actions">
          <button className="class-primary" disabled={busy}>
            {busy
              ? 'Сохраняем…'
              : mode === 'password'
                ? 'Установить пароль'
                : 'Сохранить пользователя'}
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
export function AdminHistory() {
  const [entries, setEntries] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api<AuditEvent[]>('/audit')
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tick]);
  const labels: Record<string, string> = {
    USER_CREATED: 'Создан пользователь',
    USER_UPDATED: 'Изменён доступ или профиль',
    PASSWORD_RESET: 'Установлен пароль',
    GROUP_CREATED: 'Создана группа',
    GROUP_UPDATED: 'Изменён состав группы',
  };
  return (
    <>
      <div className="class-heading">
        <p>Последние 100 действий. Пароли в журнал не записываются.</p>
        <button disabled={loading} onClick={() => setTick((t) => t + 1)}>
          Обновить журнал
        </button>
      </div>
      {error && (
        <p className="class-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Загружаем журнал…</p>
      ) : entries.length ? (
        <div className="class-audit">
          {entries.map((e) => (
            <article key={e.id}>
              <small>
                {new Date(e.createdAt).toLocaleString('ru-RU')} · @{e.actor}
              </small>
              <b>{labels[e.action] ?? e.action}</b>
              <p>{e.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <p>Действий администратора пока нет.</p>
      )}
    </>
  );
}
