import { useState } from 'react';
import type { Assignment } from '../AssignmentSheet';
import {
  composerGroups,
  filteredComposers,
  filteredTasks,
  periodForEra,
  readyIds,
  stylePeriods,
} from './catalog';
import './catalog.css';
import { pathFormats } from './composerPaths';
import ComposerPortrait from './ComposerPortrait';
import { composers, portraitSource } from './composers';
import { compositionExercises } from './compositionExercises';
import { styleExercises } from './styleExercises';
const aspects = ['Все', 'Мелодия', 'Гармония', 'Ритм', 'Форма', 'Тембр'];
export default function ComposerCatalog({
  tasks,
  onOpen,
  initialEra,
  initialAspect,
  initialTask,
  basic = false,
}: {
  tasks: Assignment[];
  onOpen: (t: Assignment) => void;
  initialEra?: string;
  initialAspect?: string;
  initialTask?: string;
  basic?: boolean;
}) {
  const target = tasks.find((t) => t.id === initialTask);
  const [period, setPeriod] = useState<string | null>(
    target?.placement.periodId ?? periodForEra(tasks, initialEra),
  );
  const [composer, setComposer] = useState<string | null>(target?.placement.composerId ?? null);
  const [aspect, setAspect] = useState(initialAspect ?? 'Все');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('Все');
  const periods = stylePeriods(tasks);
  const current = periods.find((p) => p.id === period);
  const chosen = basic
    ? tasks.filter((t) => ['basic', 'research'].includes(t.placement.periodId))
    : (current?.tasks.filter((t) => !composer || t.placement.composerId === composer) ?? []);
  const shown = filteredTasks(chosen, aspect, query).filter(
    (t) =>
      format === 'Все' ||
      (format === 'На слух' && !!styleExercises[t.id]) ||
      (format === 'Собрать' && !!compositionExercises[t.id]) ||
      (format === 'Диктант' && pathFormats[t.id] === 'Диктант'),
  );
  const ready = shown.filter((t) => readyIds.includes(t.id));
  const drafts = shown.filter((t) => !readyIds.includes(t.id));
  const selectedComposer = composerGroups(chosen).find((c) => c.id === composer);
  const visibleComposers = filteredComposers(composerGroups(current?.tasks ?? []), query);
  const reset = () => {
    setPeriod(null);
    setComposer(null);
    setAspect('Все');
    setQuery('');
    setFormat('Все');
  };
  return (
    <section
      className="composer-catalog"
      aria-label={basic ? 'Базовая практика' : 'Каталог по периодам и композиторам'}
    >
      {!basic && (
        <nav className="catalog-path" aria-label="Путь каталога">
          <button onClick={reset}>Периоды</button>
          {current && (
            <>
              <span>/</span>
              <button
                onClick={() => {
                  setComposer(null);
                  setAspect('Все');
                  setQuery('');
                }}
              >
                {current.name}
              </button>
            </>
          )}
          {selectedComposer && (
            <>
              <span>/</span>
              <span aria-current="page">{selectedComposer.name}</span>
            </>
          )}
        </nav>
      )}
      {!basic && !current ? (
        <>
          <h3>Периоды и композиторы</h3>
          <div className="period-cards">
            {periods.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setPeriod(p.id);
                  setComposer(null);
                  setQuery('');
                }}
              >
                <small>0{i + 1}</small>
                <h4>{p.name}</h4>
                <span>{composerGroups(p.tasks).length} · композиторы</span>
                <b>→</b>
              </button>
            ))}
          </div>
        </>
      ) : !basic && !composer ? (
        <>
          <h3>{current?.name}</h3>
          <label className="composer-search">
            Найти композитора
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Фамилия"
            />
          </label>
          {!visibleComposers.length && (
            <p role="status">Композитор не найден. Измените фамилию или очистите поиск.</p>
          )}
          <div className="composer-cards">
            {visibleComposers.map((c) => {
              const count = c.tasks.filter((t) => readyIds.includes(t.id)).length;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setComposer(c.id);
                    setQuery('');
                  }}
                >
                  <ComposerPortrait id={c.id} name={c.name} />
                  <div className="composer-card-text">
                    <small>{composers[c.id]?.years}</small>
                    <h4>{c.name}</h4>
                    <p>{composers[c.id]?.gesture}</p>
                    <span>{count ? `${count} · упражнения` : 'Темы в подготовке'}</span>
                    <b>→</b>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {basic ? (
            <h3>Звуковые упражнения</h3>
          ) : (
            selectedComposer && (
              <header className="composer-profile">
                <ComposerPortrait id={selectedComposer.id} name={selectedComposer.name} />
                <div>
                  <small>{composers[selectedComposer.id]?.years}</small>
                  <h3>{selectedComposer.name}</h3>
                  <p>{composers[selectedComposer.id]?.gesture}</p>
                  {composers[selectedComposer.id]?.context && (
                    <small>{composers[selectedComposer.id].context}</small>
                  )}
                  {composers[selectedComposer.id] && (
                    <details>
                      <summary>
                        {composers[selectedComposer.id].source ? 'О портрете' : 'О визуале'}
                      </summary>
                      <p>
                        {composers[selectedComposer.id].credit} ·{' '}
                        {composers[selectedComposer.id].license ?? 'Public domain'}
                      </p>
                      {composers[selectedComposer.id].licenseUrl && (
                        <a
                          href={composers[selectedComposer.id].licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Условия использования ↗
                        </a>
                      )}
                      <a
                        href={portraitSource(selectedComposer.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {composers[selectedComposer.id].source
                          ? 'Источник: Wikimedia Commons ↗'
                          : 'О композиторе ↗'}
                      </a>
                    </details>
                  )}
                </div>
              </header>
            )
          )}
          <div className="practice-formats" role="group" aria-label="Формат упражнения">
            {['Все', 'Собрать', 'На слух', 'Диктант'].map((f) => (
              <button key={f} aria-pressed={format === f} onClick={() => setFormat(f)}>
                {f}
              </button>
            ))}
          </div>
          <details className="catalog-extra">
            <summary>Фильтры</summary>
            <div className="filters">
              {aspects.map((a) => (
                <button
                  key={a}
                  aria-pressed={aspect === a}
                  className={aspect === a ? 'active' : ''}
                  onClick={() => setAspect(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <label>
              Поиск
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название или музыкальный приём"
              />
            </label>
          </details>
          {!ready.length && (
            <p role="status">
              {drafts.length
                ? 'Интерактивная практика для этих тем пока в подготовке.'
                : 'Заданий по выбранным условиям нет.'}
            </p>
          )}
          <div className="assignment-grid">
            {ready.map((t) => (
              <button key={t.id} onClick={() => onOpen(t)}>
                <small>
                  {t.minutes} мин · {t.aspects.join(' / ')}
                </small>
                <h4>{t.title}</h4>
                <p>{t.placement.focus}</p>
                <footer>
                  <span>
                    ♫{' '}
                    {pathFormats[t.id] ??
                      (styleExercises[t.id]
                        ? 'На слух'
                        : compositionExercises[t.id]
                          ? 'Собрать'
                          : 'Практика')}
                  </span>
                  <b>Открыть →</b>
                </footer>
              </button>
            ))}
          </div>
          {!!drafts.length && (
            <details className="catalog-extra">
              <summary>Темы в подготовке · {drafts.length}</summary>
              <div className="catalog-drafts">
                {drafts.map((t) => (
                  <button key={t.id} onClick={() => onOpen(t)}>
                    <span>{t.title}</span>
                    <small>Посмотреть тему →</small>
                  </button>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
