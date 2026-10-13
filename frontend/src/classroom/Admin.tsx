import { useState } from 'react';
import AiSettings from './AiSettings';
import { type Group, type Person, type Viewer } from './api';
import './classroom.css';
import ConfirmLeave from './ConfirmLeave';
import GroupForm from './GroupForm';
import { PendingChanges, usePendingGroup } from './PendingChanges';
import UserForm from './UserForm';
import UserManager, { AdminHistory } from './UserManager';
export default function Admin({
  viewer,
  users,
  groups,
  reload,
}: {
  viewer: Viewer;
  users: Person[];
  groups: Group[];
  reload: () => void;
}) {
  const [panel, setPanel] = useState<'users' | 'groups' | 'audit' | 'ai'>('users');
  const [newUser, setNewUser] = useState(false);
  const [group, setGroup] = useState<Group | 'new' | null>(null);
  const { dirty, report } = usePendingGroup();
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
  const navigate = (action: () => void) => {
    if (dirty) setLeaveAction(() => action);
    else action();
  };
  const changePanel = (next: typeof panel) => {
    if (next !== panel)
      navigate(() => {
        setPanel(next);
        setGroup(null);
        setNewUser(false);
      });
  };
  return (
    <PendingChanges.Provider value={report}>
      {leaveAction && (
        <ConfirmLeave
          cancel={() => setLeaveAction(null)}
          leave={() => {
            setLeaveAction(null);
            leaveAction();
          }}
        />
      )}
      <div className="class-stats">
        <span>
          <b>{users.filter((u) => u.role === 'STUDENT').length}</b> ученики
        </span>
        <span>
          <b>{users.filter((u) => u.role === 'TEACHER').length}</b> преподаватели
        </span>
        <span>
          <b>{groups.length}</b> группы
        </span>
      </div>
      <div className="class-tabs">
        <button aria-pressed={panel === 'users'} onClick={() => changePanel('users')}>
          Пользователи
        </button>
        <button aria-pressed={panel === 'groups'} onClick={() => changePanel('groups')}>
          Группы и состав
        </button>
        <button aria-pressed={panel === 'audit'} onClick={() => changePanel('audit')}>
          Журнал действий
        </button>
        <button aria-pressed={panel === 'ai'} onClick={() => changePanel('ai')}>
          Настройки ИИ
        </button>
      </div>
      {panel === 'ai' ? (
        <AiSettings />
      ) : panel === 'audit' ? (
        <AdminHistory />
      ) : panel === 'users' ? (
        <>
          <div className="class-heading">
            <p>Учётные записи хранятся в базе. Пароли не показываются.</p>
            <button className="class-primary" onClick={() => navigate(() => setNewUser(!newUser))}>
              ＋ Пользователь
            </button>
          </div>
          {newUser ? (
            <UserForm
              done={() => {
                setNewUser(false);
                reload();
              }}
            />
          ) : (
            <UserManager users={users} viewer={viewer} reload={reload} />
          )}
        </>
      ) : (
        <>
          <div className="class-heading">
            <p>Преподаватель назначает задания только ученикам своих групп.</p>
            <button className="class-primary" onClick={() => navigate(() => setGroup('new'))}>
              ＋ Группа
            </button>
          </div>
          {group && (
            <GroupForm
              key={group === 'new' ? 'new' : group.id}
              group={group === 'new' ? undefined : group}
              users={users}
              close={() => setGroup(null)}
              done={() => {
                setGroup(null);
                reload();
              }}
            />
          )}
          <div className="class-cards">
            {groups.map((g) => (
              <article key={g.id}>
                <h4>{g.name}</h4>
                <p>
                  {g.teacher.displayName} · {g.students.length} учеников
                </p>
                <button onClick={() => navigate(() => setGroup(g))}>Изменить состав</button>
              </article>
            ))}
          </div>
        </>
      )}
    </PendingChanges.Provider>
  );
}
