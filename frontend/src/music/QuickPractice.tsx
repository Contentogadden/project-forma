import { useEffect, useRef, useState } from 'react';
import { adaptiveQuestion, emptyMemory, recordAnswer, type PracticeMemory } from './adaptive';
import { MusicAudio } from './audio';
import { drillNames, makeQuestion, type DrillKind } from './drills';
import './quick-practice.css';

export default function QuickPractice({ initialKind = 'notes' }: { initialKind?: DrillKind }) {
  const [kind, setKind] = useState<DrillKind>(initialKind);
  const [number, setNumber] = useState(0);
  const [question, setQuestion] = useState(() => makeQuestion(initialKind, 0));
  const [choice, setChoice] = useState('');
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const memories = useRef<Partial<Record<DrillKind, PracticeMemory>>>({});
  const [tempo, setTempo] = useState(80);
  const [focused, setFocused] = useState(false);
  const [tried, setTried] = useState(false);
  const [hint, setHint] = useState('');
  const [hintBusy, setHintBusy] = useState(false);
  const [adultConsent, setAdultConsent] = useState(false);
  const hintVersion = useRef(0);
  async function help() {
    const version = ++hintVersion.current;
    setHintBusy(true);
    try {
      const csrf = await fetch('/api/auth/csrf').then((r) => r.json());
      const r = await fetch('/api/student/practice/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
        body: JSON.stringify({
          adultConsent,
          kind,
          pitches: question.pitches,
          errors: memories.current[kind]?.mistakes[question.answer] ?? 1,
        }),
      });
      if (!r.ok) throw new Error();
      const h = await r.json();
      if (version === hintVersion.current)
        setHint(`${h.source === 'ai' ? 'ИИ-подсказка' : 'Подсказка'}: ${h.text}`);
    } catch {
      if (version === hintVersion.current)
        setHint('Подсказка недоступна. Послушайте ещё раз и сравните звуки по одному.');
    } finally {
      if (version === hintVersion.current) setHintBusy(false);
    }
  }
  function clearHint() {
    hintVersion.current++;
    setHint('');
    setHintBusy(false);
    setTried(false);
  }
  const audio = useRef<MusicAudio | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    audio.current = new MusicAudio();
    const stop = () => {
      if (document.hidden) {
        generation.current++;
        audio.current?.stop();
        setPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', stop);
    return () => {
      generation.current++;
      audio.current?.dispose();
      document.removeEventListener('visibilitychange', stop);
    };
  }, []);
  function start(next: DrillKind) {
    clearHint();
    generation.current++;
    audio.current?.stop();
    setPlaying(false);
    setKind(next);
    setNumber(0);
    setScore(0);
    setChoice('');
    setFinished(false);
    const a = adaptiveQuestion(next, 0, memories.current[next] ?? emptyMemory());
    setQuestion(a.question);
    setTempo(a.tempo);
    setFocused(a.focused);
    setError('');
  }
  async function listen() {
    const g = ++generation.current;
    setPlaying(true);
    setError('');
    try {
      await audio.current!.play(
        {
          events: question.pitches.map((midi, i) => ({
            midi,
            beat: kind === 'memory' ? i + (i >= 4 ? 1 : 0) : kind === 'intervals' ? i : 0,
            duration: 1.2,
            gain: 0.8,
          })),
          beats: kind === 'memory' ? 10 : kind === 'intervals' ? 3 : 2,
          stepBeats: 1,
        },
        tempo,
        'soft',
        0.65,
        false,
        () => {},
        () => {
          if (g === generation.current) setPlaying(false);
        },
      );
    } catch {
      if (g === generation.current) {
        setPlaying(false);
        setError('Звук не загрузился. Попробуйте ещё раз.');
      }
    }
  }
  function answer(value: string) {
    if (choice === question.answer) return;
    setChoice(value);
    if (!tried) {
      memories.current[kind] = recordAnswer(
        memories.current[kind] ?? emptyMemory(),
        question,
        value === question.answer,
      );
      if (value === question.answer) setScore((n) => n + 1);
      setTried(true);
    }
  }
  function next() {
    clearHint();
    generation.current++;
    audio.current?.stop();
    setPlaying(false);
    if (number === 9) {
      setFinished(true);
      return;
    }
    setNumber((n) => n + 1);
    const a = adaptiveQuestion(kind, number + 1, memories.current[kind] ?? emptyMemory());
    setQuestion(a.question);
    setTempo(a.tempo);
    setFocused(a.focused);
    setChoice('');
    setError('');
  }
  return (
    <section className="quick-practice" aria-label="Базовая практика">
      <nav aria-label="Выберите навык">
        {(Object.keys(drillNames) as DrillKind[]).map((k) => (
          <button aria-pressed={kind === k} key={k} onClick={() => start(k)}>
            {drillNames[k]}
          </button>
        ))}
      </nav>
      <div className="quick-card">
        {finished ? (
          <>
            <h3>{score} из 10</h3>
            <p>
              {score >= 8
                ? 'Хороший результат. Попробуйте другой навык.'
                : 'Повторите серию: слушайте и сравнивайте без спешки.'}
            </p>
            <button className="quick-main" onClick={() => start(kind)}>
              Ещё 10 вопросов
            </button>
          </>
        ) : (
          <>
            <header>
              <span>{number + 1} / 10</span>
              <span>С первой попытки: {score}</span>
            </header>
            <h3>
              {kind === 'notes'
                ? 'Какая нота?'
                : kind === 'intervals'
                  ? 'Какой интервал?'
                  : kind === 'memory'
                    ? 'Какая нота изменилась?'
                    : 'Мажор или минор?'}
            </h3>
            {kind === 'notes' && <SingleNote midi={question.pitches[0]} />}
            <button className="quick-listen" onClick={() => void listen()}>
              {playing ? '▶ Слушать ещё раз' : '▶ Слушать'}
            </button>
            <div className="quick-choices">
              {question.choices.map((c) => (
                <button
                  key={c}
                  disabled={choice === question.answer}
                  className={
                    choice
                      ? choice === question.answer && c === question.answer
                        ? 'correct'
                        : c === choice
                          ? 'incorrect'
                          : ''
                      : ''
                  }
                  onClick={() => answer(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="quick-feedback" role="status" aria-live="polite">
              {choice && (
                <>
                  <strong>
                    {choice === question.answer ? 'Верно' : 'Пока неверно. Попробуйте ещё раз.'}
                  </strong>
                  {choice === question.answer ? (
                    <p>{question.explanation}</p>
                  ) : (
                    <>
                      <label className="ai-consent">
                        <input
                          type="checkbox"
                          checked={adultConsent}
                          onChange={(e) => setAdultConsent(e.target.checked)}
                        />{' '}
                        Мне 18+. Разрешаю передавать ноты упражнения выбранному провайдеру (Google
                        или Groq) для ИИ-подсказки.
                      </label>
                      <button disabled={hintBusy} onClick={() => void help()}>
                        {hintBusy ? 'Готовим подсказку…' : 'Помоги услышать'}
                      </button>
                      {hint && <p>{hint}</p>}
                    </>
                  )}
                  <button className="quick-main" onClick={next}>
                    {number === 9 ? 'Показать результат' : 'Следующий вопрос →'}
                  </button>
                </>
              )}
              {error && <p role="alert">{error}</p>}
            </div>
          </>
        )}
      </div>
      <small>
        {focused ? 'Закрепляем тему, в которой были ошибки. ' : ''}
        {tempo === 60 ? 'Темп снижен. ' : ''}Без подтверждения — локальная подсказка. Результат с
        первой попытки.
      </small>
    </section>
  );
}
function SingleNote({ midi }: { midi: number }) {
  const y: Record<number, number> = {
    60: 105,
    62: 95,
    64: 85,
    65: 75,
    67: 65,
    69: 55,
    71: 45,
    72: 35,
  };
  return (
    <svg
      className="quick-staff"
      viewBox="0 0 400 150"
      role="img"
      aria-label="Определите ноту на скрипичном стане"
    >
      {[25, 45, 65, 85, 105].map((line) => (
        <line key={line} x1="35" x2="365" y1={line} y2={line} stroke="currentColor" />
      ))}
      <text x="40" y="99" fontSize="65">
        𝄞
      </text>
      {midi === 60 && <line x1="200" x2="240" y1="125" y2="125" stroke="currentColor" />}
      <ellipse
        cx="220"
        cy={y[midi] + 20}
        rx="12"
        ry="8"
        transform={`rotate(-18 220 ${y[midi] + 20})`}
      />
      <line
        x1="230"
        x2="230"
        y1={y[midi] + 20}
        y2={y[midi] - 30}
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
