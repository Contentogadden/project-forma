import { useEffect, useState } from 'react';
import Admin from './Admin';
import {
  api,
  countWord,
  type ConstructorSeed,
  type Group,
  type Person,
  type Template,
  type Viewer,
  type Work,
} from './api';
import AssignPanel from './AssignPanel';
import './classroom.css';
import { date, errorText } from './format';
import { PendingChanges, usePendingGroup } from './PendingChanges';
import TemplateEditor from './TemplateEditor';
import WorkList, { Empty } from './WorkList';
import WorkPanel from './WorkPanel';
export default function Classroom({ viewer, seed }: { viewer: Viewer; seed?: ConstructorSeed }) {
  const { dirty, report } = usePendingGroup();
  return (
    <PendingChanges.Provider value={report}>
      <ClassroomContent viewer={viewer} seed={seed} pending={dirty} />
    </PendingChanges.Provider>
  );
}

function ClassroomContent({
  viewer,
  seed,
  pending,
}: {
  viewer: Viewer;
  seed?: ConstructorSeed;
  pending: boolean;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<Person[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [editor, setEditor] = useState<Template | 'new' | null>(
    seed && viewer.role === 'TEACHER' ? 'new' : null,
  );
  const [assignment, setAssignment] = useState<Template | null>(null);
  const [work, setWork] = useState<Work | null>(null);
  const reload = () => setTick((t) => t + 1);
  useEffect(() => {
    document.querySelector('.dashboard')?.scrollTo({ top: 0 });
  }, [editor, assignment, work]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    const load = async () => {
      if (viewer.role === 'ADMIN') {
        const [loadedGroups, loadedUsers] = await Promise.all([
          api<Group[]>('/groups'),
          api<Person[]>('/users'),
        ]);
        if (alive) {
          setGroups(loadedGroups);
          setUsers(loadedUsers);
        }
      } else if (viewer.role === 'TEACHER') {
        const [loadedGroups, loadedTemplates, loadedWorks] = await Promise.all([
          api<Group[]>('/groups'),
          api<Template[]>('/templates'),
          api<Work[]>('/works'),
        ]);
        if (alive) {
          setGroups(loadedGroups);
          setTemplates(loadedTemplates);
          setWorks(loadedWorks);
        }
      } else {
        const loadedWorks = await api<Work[]>('/works');
        if (alive) setWorks(loadedWorks);
      }
    };
    load()
      .catch((e) => {
        if (alive) setError(errorText(e));
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [viewer.username, viewer.role, tick]);
  if (editor)
    return (
      <TemplateEditor
        template={editor === 'new' ? undefined : editor}
        source={seed?.kind}
        close={() => setEditor(null)}
        saved={(t) => {
          setEditor(null);
          reload();
          setAssignment(t);
        }}
      />
    );
  if (assignment)
    return (
      <AssignPanel
        template={assignment}
        groups={groups}
        close={() => setAssignment(null)}
        done={() => {
          setAssignment(null);
          setTab('issued');
          reload();
        }}
      />
    );
  if (work)
    return (
      <WorkPanel
        key={work.id}
        initial={work}
        teacher={viewer.role === 'TEACHER'}
        close={() => {
          setWork(null);
          reload();
        }}
      />
    );
  return (
    <section className="classroom">
      {error && (
        <p className="class-error" role="alert">
          {error}
        </p>
      )}
      <div className="class-heading">
        <div>
          <span className="class-eyebrow">
            {viewer.role === 'ADMIN'
              ? 'Управление'
              : viewer.role === 'TEACHER'
                ? 'Мастерская преподавателя'
                : 'Мои занятия'}
          </span>
          <h3>
            {viewer.role === 'ADMIN'
              ? 'Люди и группы'
              : viewer.role === 'TEACHER'
                ? 'От замысла к звучанию'
                : 'Назначено мне'}
          </h3>
        </div>
        <button
          onClick={reload}
          disabled={loading || pending}
          title={pending ? 'Сначала сохраните или закройте редактор' : undefined}
        >
          Обновить список
        </button>
      </div>
      {loading && !loaded ? (
        <p role="status">Загружаем кабинет…</p>
      ) : viewer.role === 'ADMIN' ? (
        <Admin viewer={viewer} users={users} groups={groups} reload={reload} />
      ) : (
        <>
          {viewer.role === 'TEACHER' && (
            <>
              <div className="class-stats">
                <span>
                  <b>{groups.length}</b> {countWord(groups.length, 'группа', 'группы', 'групп')}
                </span>
                <span>
                  <b>{templates.length}</b>{' '}
                  {countWord(templates.length, 'шаблон', 'шаблона', 'шаблонов')}
                </span>
                <span>
                  <b>{works.filter((w) => w.status === 'SUBMITTED').length}</b> на проверку
                </span>
              </div>
              <div className="class-tabs">
                {[
                  ['tasks', 'Мои задания'],
                  ['issued', 'Выданные'],
                  ['review', 'На проверку'],
                  ['groups', 'Мои группы'],
                ].map(([id, label]) => (
                  <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
          {viewer.role === 'TEACHER' && tab === 'tasks' ? (
            <>
              <div className="class-heading">
                <p>Мелодические задания · 2 такта · живое фортепиано</p>
                <button className="class-primary" onClick={() => setEditor('new')}>
                  ＋ Создать задание
                </button>
              </div>
              {!templates.length && (
                <Empty
                  title="Первое задание начинается с мотива"
                  text="Возьмите «Вопрос и ответ» из банка Forma, измените ноты и выдайте ученикам."
                />
              )}
              <div className="class-cards">
                {templates.map((t) => (
                  <article key={t.id}>
                    <span className="class-eyebrow">Мелодия · шаблон #{t.id}</span>
                    <h4>{t.definition.title}</h4>
                    <p>{t.definition.instruction}</p>
                    <small>
                      Изменён {date(t.updatedAt)} · выданные копии сохраняют свои условия
                    </small>
                    <div className="class-actions">
                      <button onClick={() => setEditor(t)}>Редактировать</button>
                      <button className="class-primary" onClick={() => setAssignment(t)}>
                        Назначить →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : viewer.role === 'TEACHER' && tab === 'groups' ? (
            <div className="class-cards">
              {!groups.length && (
                <Empty
                  title="Групп пока нет"
                  text="Администратор может прикрепить к вам группу и учеников."
                />
              )}
              {groups.map((g) => (
                <article key={g.id}>
                  <h4>{g.name}</h4>
                  <p>
                    {g.students.length}{' '}
                    {countWord(g.students.length, 'ученик', 'ученика', 'учеников')}
                  </p>
                  {g.students.map((s) => (
                    <div className="class-person" key={s.id}>
                      {s.displayName}
                      <small>
                        @{s.username}
                        {s.enabled ? '' : ' · вход отключён'}
                      </small>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          ) : (
            <WorkList
              key={tab}
              works={
                tab === 'review' && viewer.role === 'TEACHER'
                  ? works.filter((w) => w.status === 'SUBMITTED')
                  : works
              }
              teacher={viewer.role === 'TEACHER'}
              open={setWork}
            />
          )}
        </>
      )}
    </section>
  );
}
