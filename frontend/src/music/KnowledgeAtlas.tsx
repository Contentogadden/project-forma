import { useState } from 'react';
import type { Assignment } from '../AssignmentSheet';
import './atlas.css';
import { normalizeCatalogQuery } from './catalog';
import {
  atlasFamilies,
  domains,
  knowledgeGroups,
  neutralAssignment,
  taskPlacements,
  topicCount,
} from './curriculum';
import { studyLessons } from './studyContent';
import StudyModules from './StudyModules';
import { styleExercises } from './styleExercises';

function MusicMark({ variant = 0 }: { variant?: number }) {
  return (
    <svg viewBox="0 0 260 100" aria-hidden="true" className="atlas-mark">
      {[25, 37, 49, 61, 73].map((y) => (
        <line key={y} x1="0" x2="260" y1={y} y2={y} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const y = 31 + ((i * 17 + variant * 13) % 48);
        return (
          <g key={i}>
            <ellipse
              cx={20 + i * 43}
              cy={y}
              rx="7"
              ry="4.7"
              transform={`rotate(-20 ${20 + i * 43} ${y})`}
            />
            <path d={`M ${26 + i * 43} ${y} v -22`} />
            {variant % 3 === 1 && <ellipse cx={20 + i * 43} cy={y + 12} rx="7" ry="4.7" />}
          </g>
        );
      })}
    </svg>
  );
}
const formats = [
  ['all', 'Все'],
  ['build', 'Собрать'],
  ['listen', 'На слух'],
  ['dictation', 'Диктант'],
];
export default function KnowledgeAtlas({
  tasks,
  onOpen,
  initialAspect,
  initialTask,
  initialDomain,
  username,
}: {
  tasks: Assignment[];
  onOpen: (task: Assignment) => void;
  initialAspect?: string;
  initialTask?: string;
  initialDomain?: string;
  username: string;
}) {
  const initial =
    initialDomain ??
    (initialTask
      ? taskPlacements[initialTask]?.domain
      : (
          {
            Мелодия: 'grammar',
            Гармония: 'harmony',
            Ритм: 'rhythm',
            Форма: 'form',
            Тембр: 'texture',
          } as Record<string, string>
        )[initialAspect ?? '']);
  const [domain, setDomain] = useState<string | null>(initial ?? null);
  const [topic, setTopic] = useState<number | undefined>();
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('all');
  const [limit, setLimit] = useState(12);
  const [variants, setVariants] = useState<Record<string, string>>({});
  const current = domains.find((d) => d.id === domain);
  const families = atlasFamilies(tasks, domain ?? undefined, topic, query, format);
  const choose = (id: string | null) => {
    setDomain(id);
    setTopic(undefined);
    setQuery('');
    setFormat('all');
    setLimit(12);
  };
  const allFamilies = atlasFamilies(tasks);
  const q = normalizeCatalogQuery(query);
  const visibleDomains = domains.filter(
    (d) => !q || normalizeCatalogQuery(`${d.title} ${d.caption} ${d.topics.join(' ')}`).includes(q),
  );
  return (
    <section className="knowledge-atlas" aria-label="Атлас музыкальных компетенций">
      <div className="atlas-topline">
        <button onClick={() => choose(null)}>FORMA / АТЛАС</button>
        <span>
          {domains.length} областей · {topicCount} тем
        </span>
      </div>
      {!current ? (
        <>
          <header className="knowledge-intro">
            <div>
              <h2>
                Атлас музыканта<span>От звука к исследованию.</span>
              </h2>
              <p>Выберите навык. Музыкальный материал — внутри.</p>
              <label className="atlas-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Найти тему: каденции, фуга, диктант…"
                  aria-label="Найти тему"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <button
              className="atlas-feature"
              onClick={() => choose('harmony')}
              aria-label="Открыть область Гармония"
            >
              <img src="/art-harmony.jpeg" alt="" />
              <div>
                <small>В ФОКУСЕ</small>
                <strong>Гармония</strong>
                <span>Бас → голоса → целое ↗</span>
              </div>
              <MusicMark variant={1} />
            </button>
          </header>
          <div className="knowledge-groups">
            {knowledgeGroups.map((group, gi) => {
              const entries = visibleDomains.filter((d) => d.group === group.id);
              return entries.length ? (
                <section
                  key={group.id}
                  className={`knowledge-group group-${gi}`}
                  aria-label={group.title}
                >
                  <header>
                    <small>0{gi + 1}</small>
                    <div>
                      <h3>{group.title}</h3>
                      <span>{group.caption}</span>
                    </div>
                  </header>
                  {entries.map((d) => {
                    const studies = studyLessons.filter((l) => l.domain === d.id).length;
                    const count = allFamilies.filter((f) => f.placement.domain === d.id).length;
                    return (
                      <button key={d.id} className="domain-entry" onClick={() => choose(d.id)}>
                        <span>
                          <strong>{d.title}</strong>
                          <small>{d.caption}</small>
                        </span>
                        <span className="domain-meta">
                          {d.topics.length} тем
                          <br />
                          {studies
                            ? `Разборы: ${studies}`
                            : count
                              ? `Практика: ${count}`
                              : 'План курса'}
                          <b>↗</b>
                        </span>
                      </button>
                    );
                  })}
                </section>
              ) : null;
            })}
          </div>
          {!visibleDomains.length && (
            <p role="status">Тема не найдена. Попробуйте другое название или очистите поиск.</p>
          )}
          <div className="atlas-footnote">
            <span>Слух · письмо · анализ · исследование</span>
            <p>
              Карта компетенций, не перечень требований одного вуза. Практика пока покрывает только
              часть тем.
            </p>
          </div>
        </>
      ) : (
        <>
          <nav className="atlas-breadcrumb" aria-label="Путь обучения">
            <button onClick={() => choose(null)}>Все области</button>
            <span>/</span>
            <span aria-current="page">{current.title}</span>
          </nav>
          <header className="domain-heading">
            <div>
              <small>{knowledgeGroups.find((g) => g.id === current.group)?.title}</small>
              <h2>{current.title}</h2>
              <p>{current.caption}</p>
            </div>
            <MusicMark variant={domains.indexOf(current)} />
          </header>
          <div className="domain-workspace">
            <aside className="topic-index" aria-label="Темы области">
              <button
                className={topic === undefined ? 'selected' : ''}
                aria-pressed={topic === undefined}
                onClick={() => {
                  setTopic(undefined);
                  setLimit(12);
                }}
              >
                Обзор области <span>{current.topics.length}</span>
              </button>
              {current.topics.map((title, i) => {
                const ready =
                  atlasFamilies(tasks, current.id, i).length ||
                  studyLessons.filter((l) => l.domain === current.id && l.topic === i).length;
                return (
                  <button
                    key={i}
                    className={topic === i ? 'selected' : ''}
                    aria-pressed={topic === i}
                    onClick={() => {
                      setTopic(i);
                      setLimit(12);
                    }}
                  >
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    <span>{title}</span>
                    <i
                      aria-label={
                        ready ? 'Есть техническая практика' : 'Практика ещё не подготовлена'
                      }
                      className={ready ? 'topic-ready' : ''}
                    />
                  </button>
                );
              })}
              <div className="related-domains">
                <small>СВЯЗАННЫЕ ОБЛАСТИ</small>
                {current.related.map((id) => (
                  <button key={id} onClick={() => choose(id)}>
                    {domains.find((d) => d.id === id)?.title} ↗
                  </button>
                ))}
              </div>
            </aside>
            <div className="domain-practice">
              <StudyModules
                key={`${username}:${current.id}:${topic ?? 'all'}`}
                username={username}
                domain={current.id}
                topic={topic}
              />
              {(atlasFamilies(tasks, current.id, topic).length > 0 ||
                !studyLessons.some(
                  (l) => l.domain === current.id && (topic === undefined || l.topic === topic),
                )) && (
                <>
                  <div className="practice-title">
                    <h3>{topic === undefined ? 'Практика' : current.topics[topic]}</h3>
                    <span>Семейства: {families.length}</span>
                  </div>
                  <div className="atlas-toolbar">
                    <div role="group" aria-label="Формат практики">
                      {formats.map(([id, label]) => (
                        <button
                          key={id}
                          aria-pressed={format === id}
                          onClick={() => {
                            setFormat(id);
                            setLimit(12);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="search"
                      aria-label="Поиск упражнения"
                      placeholder="Найти упражнение"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setLimit(12);
                      }}
                    />
                  </div>
                  {!!families.length && (
                    <p className="practice-context">
                      Технические модели Forma. Варианты материала объединены; это не анализ
                      авторского стиля.
                    </p>
                  )}
                  <div className="skill-families">
                    {families.slice(0, limit).map((family, i) => {
                      const chosen =
                        family.tasks.find((t) => t.id === variants[family.id]) ?? family.tasks[0];
                      const listening = !!styleExercises[chosen.id];
                      return (
                        <article key={family.id} className="skill-family">
                          <div className="family-label">
                            <small>
                              {String(i + 1).padStart(2, '0')} /{' '}
                              {chosen.id.endsWith('-dictation')
                                ? 'ДИКТАНТ'
                                : listening
                                  ? 'НА СЛУХ'
                                  : 'СОБРАТЬ'}
                            </small>
                            <span>{chosen.minutes} мин</span>
                          </div>
                          <h4>{family.title}</h4>
                          <p>
                            {
                              domains.find((d) => d.id === family.placement.domain)?.topics[
                                family.placement.topic
                              ]
                            }
                          </p>
                          <footer>
                            {family.tasks.length > 1 ? (
                              <label>
                                Материал
                                <select
                                  aria-label={`Материал: ${family.title}`}
                                  value={chosen.id}
                                  onChange={(e) =>
                                    setVariants((v) => ({ ...v, [family.id]: e.target.value }))
                                  }
                                >
                                  {family.tasks.map((t, j) => (
                                    <option key={t.id} value={t.id}>
                                      {String(j + 1).padStart(2, '0')} · {t.title}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : (
                              <span>Одна учебная модель</span>
                            )}
                            <button
                              onClick={() => onOpen(neutralAssignment(chosen))}
                              aria-label={`Открыть: ${family.title}`}
                            >
                              Открыть ↗
                            </button>
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                  {families.length > limit && (
                    <button className="atlas-more" onClick={() => setLimit((n) => n + 12)}>
                      Показать ещё {Math.min(12, families.length - limit)} ↓
                    </button>
                  )}
                  {!families.length &&
                    !studyLessons.some(
                      (l) => l.domain === current.id && (topic === undefined || l.topic === topic),
                    ) && (
                      <div className="topic-empty" role="status">
                        <MusicMark variant={3} />
                        <h4>
                          {query || format !== 'all'
                            ? 'Нет упражнений по этим условиям'
                            : 'Тема есть в программе'}
                        </h4>
                        <p>
                          {query || format !== 'all'
                            ? 'Сбросьте формат или измените поиск.'
                            : 'Интерактивная практика ещё не подготовлена. Короткие технические упражнения не заменяют изучение этой темы.'}
                        </p>
                        {(query || format !== 'all') && (
                          <button
                            onClick={() => {
                              setQuery('');
                              setFormat('all');
                            }}
                          >
                            Сбросить фильтры
                          </button>
                        )}
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
