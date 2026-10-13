import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import AssignmentSheet, { type Assignment } from './AssignmentSheet';
import Classroom from './classroom/Classroom';
import ConfirmLeave from './classroom/ConfirmLeave';
import { PendingChanges, usePendingGroup } from './classroom/PendingChanges';
import type { ConstructorSeed, Viewer } from './classroom/api';
import KnowledgeAtlas from './music/KnowledgeAtlas';
import QuickPractice from './music/QuickPractice';
import { type PracticeTarget } from './practiceNavigation';
import './showcase.css';
export default function Dashboard({
  viewer,
  close,
  target,
}: {
  viewer: Viewer;
  close: () => void;
  target?: PracticeTarget;
}) {
  const [section, setSection] = useState<'classroom' | 'practice'>(
    target || viewer.role === 'STUDENT' ? 'practice' : 'classroom',
  );
  const { dirty: pending, report: reportPending } = usePendingGroup();
  const [constructorSeed, setConstructorSeed] = useState<ConstructorSeed | undefined>();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [section, constructorSeed?.key]);
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
  const navigate = (action: () => void) => {
    if (pending) setLeaveAction(() => action);
    else action();
  };
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/v1/assignments')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setTasks)
      .catch(() =>
        setError('Не удалось загрузить задания. Закройте кабинет и попробуйте открыть его снова.'),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (target?.task && tasks.length) setSelected(tasks.find((t) => t.id === target.task) ?? null);
  }, [target?.task, tasks]);
  const titles = {
    ADMIN: 'Управление школой',
    TEACHER: 'Класс и задания',
    STUDENT: 'Моя практика',
  };
  return (
    <motion.div
      ref={panel}
      className="dashboard"
      inert={!!selected}
      aria-hidden={selected ? true : undefined}
      style={{ visibility: selected ? 'hidden' : undefined }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <header>
        <a className="brand">
          PROJECT FORMA <span>/ {viewer.role}</span>
        </a>
        <div>
          <span>{viewer.displayName}</span>
          <button onClick={() => navigate(close)}>Закрыть ×</button>
        </div>
      </header>
      {section === 'classroom' && (
        <div className="dashboard-intro classroom-intro">
          <h2>{titles[viewer.role]}</h2>
        </div>
      )}
      <div className="workspace-switch">
        <button
          aria-pressed={section === 'classroom'}
          onClick={() => {
            if (section !== 'classroom') navigate(() => setSection('classroom'));
          }}
        >
          {viewer.role === 'ADMIN'
            ? 'Школа'
            : viewer.role === 'TEACHER'
              ? 'Мой класс'
              : 'Назначено мне'}
        </button>
        <button
          aria-pressed={section === 'practice'}
          onClick={() => {
            if (section !== 'practice') navigate(() => setSection('practice'));
          }}
        >
          Практика Forma
        </button>
      </div>
      {section === 'classroom' ? (
        <PendingChanges.Provider value={reportPending}>
          <Classroom
            key={`${viewer.username}-${constructorSeed?.key ?? 0}`}
            seed={constructorSeed}
            viewer={viewer}
          />
        </PendingChanges.Provider>
      ) : (
        <>
          {loading || error ? (
            <p className="catalog-message" role="status">
              {error || 'Загружаем задания…'}
            </p>
          ) : (
            <KnowledgeAtlas
              username={viewer.username}
              tasks={tasks}
              onOpen={setSelected}
              initialAspect={target?.aspect}
              initialTask={target?.task}
              initialDomain={target?.domain}
            />
          )}
          <details className="atlas-quick-practice">
            <summary>Быстрая слуховая разминка</summary>
            <QuickPractice />
          </details>
        </>
      )}
      <AnimatePresence>
        {selected && (
          <AssignmentSheet
            key={`${viewer.username}:${selected.id}`}
            task={selected}
            username={viewer.username}
            close={() => setSelected(null)}
            copyToClass={
              viewer.role === 'TEACHER' &&
              ['melody-question', 'beethoven-motive'].includes(selected.id)
                ? () => {
                    setConstructorSeed({
                      kind: selected.id as ConstructorSeed['kind'],
                      key: Date.now(),
                    });
                    setSelected(null);
                    setSection('classroom');
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>
      {leaveAction && (
        <ConfirmLeave
          cancel={() => setLeaveAction(null)}
          leave={() => {
            setLeaveAction(null);
            leaveAction();
          }}
        />
      )}
    </motion.div>
  );
}
