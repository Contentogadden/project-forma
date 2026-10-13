import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './assignments.css';
import MusicWorkshop from './music/MusicWorkshop';
import { interactiveIds } from './music/model';

export type Assignment = {
  id: string;
  title: string;
  era: string;
  composer: string;
  aspects: string[];
  level: string;
  minutes: number;
  prompt: string;
  deliverable: string;
  material: string;
  steps: string[];
  criteria: string[];
  hint: string;
  placement: { periodId: string; periodName: string; composerId: string; focus: string };
};

export default function AssignmentSheet({
  task,
  close,
  copyToClass,
}: {
  task: Assignment;
  username: string;
  close: () => void;
  copyToClass?: () => void;
}) {
  const interactive = interactiveIds.includes(task.id);
  const reduced = useReducedMotion();
  const screen = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const background = Array.from(document.body.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && !node.contains(screen.current),
    );
    const inertValues = background.map((node) => node.inert);
    const ariaValues = background.map((node) => node.getAttribute('aria-hidden'));
    background.forEach((node) => {
      node.inert = true;
      node.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = 'hidden';
    screen.current?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        screen.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]',
        ) ?? [],
      ).filter((node) => node.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === screen.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === screen.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      background.forEach((node, i) => {
        node.inert = inertValues[i];
        if (ariaValues[i] === null) node.removeAttribute('aria-hidden');
        else node.setAttribute('aria-hidden', ariaValues[i]!);
      });
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <motion.aside
      ref={screen}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      className={`assignment-sheet exercise-screen ${interactive ? 'sound-sheet' : ''}`}
      aria-label={task.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.15 }}
    >
      <button className="close" onClick={close}>
        Назад ×
      </button>
      <span>
        {task.era} / {task.composer} / {interactive ? 'Звуковое упражнение' : 'Тема в подготовке'}
      </span>
      <h3>{task.title}</h3>
      <p className="music-caption">
        {task.placement?.focus}. Учебная модель Forma, не цитата из произведения.
      </p>
      {copyToClass && (
        <button className="copy-class-task" onClick={copyToClass}>
          ＋ Создать своё задание на основе этого
        </button>
      )}
      {interactive ? (
        <MusicWorkshop id={task.id} />
      ) : (
        <>
          <p>{task.prompt}</p>
          <p className="music-caption">
            Для этой темы звуковой редактор ещё не подготовлен. Готовые упражнения доступны у других
            композиторов и в «Базовой практике».
          </p>
        </>
      )}
      {!interactive && (
        <details className="workshop-notes">
          <summary>О теме и исходной модели</summary>
          <p className="music-caption">
            {task.composer}. Все примеры — учебные модели Forma, не цитаты из произведений.
          </p>
          <section className="source-material">
            <h4>Исходная модель</h4>
            <p>{task.material}</p>
          </section>
          <p className="music-caption">
            {interactive ? 'Звуковое упражнение выше — компактная версия этой модели.' : task.hint}
          </p>
        </details>
      )}
    </motion.aside>,
    document.body,
  );
}
