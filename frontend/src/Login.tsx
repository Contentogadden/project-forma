import { motion } from 'framer-motion';
import { FormEvent, useState } from 'react';
import type { Viewer } from './classroom/api';
import { requestJson } from './http.ts';
import './showcase.css';
type Credentials = { username: string; password: string };

const demos = import.meta.env.DEV
  ? [
      { role: 'Администратор', username: 'admin', password: 'FormaAdmin!26' },
      { role: 'Преподаватель', username: 'teacher', password: 'FormaTeacher!26' },
      { role: 'Ученик', username: 'student', password: 'FormaStudent!26' },
    ]
  : [];

export default function Login({
  close,
  success,
}: {
  close: () => void;
  success: (v: Viewer) => void;
}) {
  const [form, setForm] = useState<Credentials>({
    username: demos[2]?.username ?? '',
    password: demos[2]?.password ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const viewer = await requestJson<Viewer>('/api/auth/login', 'POST', form);
      success(viewer);
    } catch {
      setError('Не удалось войти. Проверьте логин и пароль.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <motion.div
      className="modal-backdrop"
      onMouseDown={close}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className="login"
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.55 }}
      >
        <button className="close" onClick={close}>
          Закрыть ×
        </button>
        <span className="kicker">Вход в Project Forma</span>
        <h2>Рабочее пространство</h2>
        <p>Введите логин и пароль своей учётной записи.</p>
        <div className="demo-roles">
          {demos.map((d) => (
            <button
              key={d.username}
              onClick={() => setForm({ username: d.username, password: d.password })}
              className={form.username === d.username ? 'active' : ''}
            >
              <span>{d.role}</span>
              <b>{d.username}</b>
            </button>
          ))}
        </div>
        <form onSubmit={submit}>
          <label>
            Логин
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="submit" disabled={busy}>
            {busy ? 'Входим…' : 'Войти →'}
          </button>
        </form>
      </motion.section>
    </motion.div>
  );
}
