import type { Viewer } from './classroom/api';
import './showcase.css';
export default function Workspace({
  viewer,
  open,
  logout,
}: {
  viewer: Viewer;
  open: () => void;
  logout: () => void;
}) {
  const labels = {
    ADMIN: 'Управление школой',
    TEACHER: 'Кабинет преподавателя',
    STUDENT: 'Мои занятия',
  };
  return (
    <div className="workspace">
      <span>{viewer.role}</span>
      <b>{labels[viewer.role]}</b>
      <button onClick={open}>Открыть кабинет →</button>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
