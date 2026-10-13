import { useEffect, useRef, useState } from 'react';
import { api } from '../classroom/api';
import { MusicAudio } from './audio';
import type { Score } from './model';
import './study.css';
import type { StudyLesson } from './studyContent';
import { answerScore, noteLabel, studyLessons } from './studyContent';

function SoundMap({ score }: { score: Score }) {
  const lo = Math.min(...score.events.map((e) => e.midi)) - 2;
  const hi = Math.max(...score.events.map((e) => e.midi)) + 2;
  return (
    <svg
      viewBox="0 0 600 130"
      className="study-soundmap"
      role="img"
      aria-label={`Высота вверх, время вправо. ${score.events.map((e) => `${noteLabel(e.midi)} на доле ${e.beat + 1}`).join('; ')}`}
    >
      {[20, 45, 70, 95].map((y) => (
        <line key={y} x1="20" x2="585" y1={y} y2={y} />
      ))}
      {score.events.map((e, i) => {
        const x = 20 + (e.beat / score.beats) * 560;
        const y = 100 - ((e.midi - lo) / (hi - lo)) * 85;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={Math.max(6, (e.duration / score.beats) * 550)}
              height="7"
              rx="3"
              opacity={(e.gain ?? 0.7) + 0.15}
            />
            <text x={x} y={y - 5}>
              {noteLabel(e.midi)}
            </text>
          </g>
        );
      })}
      <text x="20" y="125">
        Время →
      </text>
    </svg>
  );
}
export default function StudyModules({
  domain,
  topic,
  username,
}: {
  domain: string;
  topic?: number;
  username: string;
}) {
  const lessons = studyLessons.filter(
    (l) => l.domain === domain && (topic === undefined || l.topic === topic),
  );
  const [active, setActive] = useState<StudyLesson | null>(null);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<number[]>([]);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [progressStatus, setProgressStatus] = useState('Загружаем прогресс аккаунта…');
  const [checkError, setCheckError] = useState('');
  const request = useRef(0);
  useEffect(() => {
    let cancelled = false;
    api<{ completed: string[] }>('/progress', 'GET', undefined, '/api/student/study')
      .then((data) => {
        if (!cancelled) {
          setDone((previous) => [...new Set([...previous, ...data.completed])]);
          setProgressStatus('Проверенные результаты сохраняются в вашем аккаунте.');
        }
      })
      .catch(() => {
        if (!cancelled)
          setProgressStatus(
            'Не удалось загрузить прогресс. Повторно откройте область; проверка требует подключения к серверу.',
          );
      });
    return () => {
      cancelled = true;
      request.current++;
    };
  }, [username]);
  const audio = useRef<MusicAudio | null>(null);
  const [playing, setPlaying] = useState(false);
  const [soundStatus, setSoundStatus] = useState('');
  useEffect(() => {
    const player = new MusicAudio();
    audio.current = player;
    return () => {
      player.dispose();
      audio.current = null;
    };
  }, []);
  const stop = () => {
    audio.current?.stop();
    setPlaying(false);
  };
  const move = (n: number) => {
    request.current++;
    setSaving(false);
    stop();
    setIndex(n);
    setValue([]);
    setResult(null);
    setCheckError('');
    setSoundStatus('');
  };
  async function play(score?: Score) {
    if (!score || !score.events.length) return;
    setPlaying(true);
    setSoundStatus('Загружаем фортепиано…');
    try {
      await audio.current?.play(
        score,
        92,
        'soft',
        0.65,
        false,
        () => {},
        () => {
          setPlaying(false);
          setSoundStatus('Прослушивание завершено');
        },
        4,
        (n, total) =>
          setSoundStatus(n === total ? 'Фортепиано звучит' : `Фортепиано: ${n}/${total}`),
      );
    } catch {
      setPlaying(false);
      setSoundStatus('Не удалось загрузить звук. Попробуйте ещё раз.');
    }
  }
  if (!lessons.length) return null;
  const q = active?.questions[index];
  const change = (v: number[], interrupt = true) => {
    request.current++;
    setSaving(false);
    if (interrupt) stop();
    setValue(v);
    setResult(null);
    setCheckError('');
    setSoundStatus('');
  };
  const toggle = (n: number) =>
    change(value.includes(n) ? value.filter((v) => v !== n) : [...value, n]);
  async function check() {
    if (!q || saving) return;
    const id = q.id;
    const version = ++request.current;
    setSaving(true);
    setCheckError('');
    try {
      const feedback = await api<{ ok: boolean; text: string }>(
        `/check/${encodeURIComponent(id)}`,
        'POST',
        { answer: value },
        '/api/student/study',
      );
      if (version !== request.current) return;
      setResult(feedback);
      if (feedback.ok) setDone((previous) => [...new Set([...previous, id])]);
      setProgressStatus('Проверенные результаты сохраняются в вашем аккаунте.');
    } catch (e) {
      if (version === request.current)
        setCheckError(e instanceof Error ? e.message : 'Проверка недоступна. Попробуйте ещё раз.');
    } finally {
      if (version === request.current) setSaving(false);
    }
  }
  return (
    <section className="study-modules" aria-label="Теория и применение">
      <div className="study-section-title">
        <h3>Разобрать и применить</h3>
        <span>Теория + проверка</span>
      </div>
      {!active ? (
        <div className="study-cards">
          {lessons.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setActive(l);
                move(0);
              }}
            >
              <small>РАЗБОР · 3 ЗАДАНИЯ</small>
              <strong>{l.title}</strong>
              <span>{l.goal}</span>
              <footer>
                {l.questions.filter((q) => done.includes(q.id)).length}/3 проверено <b>Начать ↗</b>
              </footer>
            </button>
          ))}
        </div>
      ) : (
        <article className="study-reader">
          <button
            className="study-back"
            onClick={() => {
              move(0);
              setActive(null);
            }}
          >
            ← Все разборы области
          </button>
          <h4>{active.title}</h4>
          <p className="study-goal">{active.goal}</p>
          <details className="study-theory" open>
            <summary>Короткий разбор</summary>
            {active.theory.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <blockquote>{active.rule}</blockquote>
            <div className="study-example">{active.example}</div>
            <details>
              <summary>Источники и границы модели</summary>
              <p>
                Тексты и музыкальные модели Forma составлены для этих упражнений. Ссылки ниже — для
                сопоставления терминов и дальнейшего чтения. Проверяется отдельный навык, не
                владение всей темой.
              </p>
              {active.source.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                  {s.title} ↗
                </a>
              ))}
            </details>
          </details>
          {q && (
            <div className="study-question">
              <div className="study-question-nav">
                <span>Задание {index + 1}/3</span>
                <div>
                  {active.questions.map((question, i) => (
                    <button
                      key={question.id}
                      aria-label={`Задание ${i + 1}`}
                      aria-pressed={index === i}
                      onClick={() => move(i)}
                    >
                      {done.includes(question.id) ? '✓' : i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <h5>{q.title}</h5>
              <p>{q.prompt}</p>
              {q.given && (
                <div className="study-given">
                  {q.hideGiven ? (
                    <p className="study-ear-label">♫ Ноты скрыты — определите по слуху</p>
                  ) : (
                    <SoundMap score={q.given} />
                  )}
                  <button onClick={() => play(q.given)}>▶ Исходная модель</button>
                </div>
              )}
              {q.kind === 'choice' && (
                <div className="study-options">
                  {q.options!.map((option, i) => (
                    <div key={i}>
                      <button aria-pressed={value[0] === i} onClick={() => change([i], false)}>
                        <small>{String.fromCharCode(65 + i)}</small>
                        {option.label}
                      </button>
                      {option.score && (
                        <button
                          aria-label={`Слушать вариант ${String.fromCharCode(65 + i)}`}
                          onClick={() => play(option.score)}
                        >
                          ▶
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {q.kind === 'notes' && (
                <div className="study-note-input">
                  {q.answer.map((_, i) => (
                    <label key={i}>
                      Нота {i + 1}
                      <select
                        aria-label={`Ответ: нота ${i + 1}`}
                        value={value[i] ?? 0}
                        onChange={(e) => {
                          const next = Array.from(
                            { length: q.answer.length },
                            (_, j) => value[j] ?? 0,
                          );
                          next[i] = Number(e.target.value);
                          change(next);
                        }}
                      >
                        <option value={0}>Выберите звук</option>
                        {q.noteChoices!.map((n) => (
                          <option key={n} value={n}>
                            {noteLabel(n)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              {q.kind === 'accents' && (
                <div
                  className="study-beat-grid"
                  style={{ gridTemplateColumns: `repeat(${q.length ?? 6},1fr)` }}
                  role="group"
                  aria-label={`Акценты: ${q.length ?? 6} равных ячеек`}
                >
                  {Array.from({ length: q.length ?? 6 }, (_, i) => (
                    <button
                      key={i}
                      aria-label={`Акцент на ячейке ${i + 1}`}
                      aria-pressed={value.includes(i)}
                      onClick={() => toggle(i)}
                    >
                      <span>{value.includes(i) ? '●' : '○'}</span>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
              {q.kind === 'set' && (
                <div className="study-clock" role="group" aria-label="Круг классов высот 0–11">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button
                      key={i}
                      style={{
                        left: `${50 + 39 * Math.sin((i * Math.PI) / 6)}%`,
                        top: `${50 - 39 * Math.cos((i * Math.PI) / 6)}%`,
                      }}
                      aria-label={`Класс ${i}: ${noteLabel(60 + i)}`}
                      aria-pressed={value.includes(i)}
                      onClick={() => toggle(i)}
                    >
                      {i}
                      <small>{noteLabel(60 + i).replace('4', '')}</small>
                    </button>
                  ))}
                </div>
              )}
              <div className="study-actions">
                <button
                  onClick={check}
                  disabled={
                    saving || !value.length || value.some((v) => v === 0 && q.kind === 'notes')
                  }
                >
                  {saving ? 'Проверяем…' : 'Проверить'}
                </button>
                {q.kind !== 'choice' && (
                  <button
                    disabled={!value.length || value.some((v) => v === 0 && q.kind === 'notes')}
                    onClick={() => play(answerScore(q, value))}
                  >
                    ▶ Мой вариант
                  </button>
                )}
                <button
                  onClick={() => {
                    stop();
                    setSoundStatus('Звук остановлен');
                  }}
                  disabled={!playing}
                >
                  ■ Стоп
                </button>
              </div>
              {checkError && (
                <p role="alert">{checkError} Результат не сохранён. Повторите проверку.</p>
              )}
              <p className="study-audio-status" role="status">
                {soundStatus}
              </p>
              {result && (
                <div className={`study-result ${result.ok ? 'correct' : ''}`} role="status">
                  <strong>{result.ok ? 'Верно' : 'Попробуйте ещё раз'}</strong>
                  <p>{result.text}</p>
                  {result.ok && index < 2 && (
                    <button onClick={() => move(index + 1)}>Следующее задание →</button>
                  )}
                  {result.ok && index === 2 && (
                    <span>
                      {active.questions.every((question) => done.includes(question.id))
                        ? 'Все три задания проверены.'
                        : 'Последнее задание проверено. Пройдите остальные для завершения разбора.'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </article>
      )}
      <p className="study-local-note">{progressStatus}</p>
    </section>
  );
}
