import StyleOptions from './StyleOptions';
import MelodyEditor from './MelodyEditor';
import HarmonyEditor from './HarmonyEditor';
import RhythmEditor from './RhythmEditor';
import FormEditor from './FormEditor';
import RegisterEditor from './RegisterEditor';
import { useState } from 'react';
import { compositionExercises } from './compositionExercises';
import { lessons } from './lessons';
import {
  bassScore,
  compareScores,
  feedback,
  isMelody,
  isRhythm,
  question,
  registerNames,
  scoreFor,
  type MusicState,
  type Tone,
} from './model';
import { styleExercises } from './styleExercises';
import { useMusicPlayback } from './useMusicPlayback';
import { useMusicWork } from './useMusicWork';
import './workshop.css';

export default function MusicWorkshop({ id }: { id: string }) {
  const style = styleExercises[id];
  const composition = compositionExercises[id];
  const lesson = style ?? composition ?? lessons[id];
  const { state, setState, loading, loadError, saved, setSaved, saving, dirty, setDirty, save } =
    useMusicWork(id);
  const {
    playing,
    step,
    level,
    sampleLoading,
    volume,
    setVolume,
    metro,
    setMetro,
    error,
    stop,
    play,
  } = useMusicPlayback(id, state.tempo, state.tone);

  const [selected, setSelected] = useState(
    composition?.editable[0] ?? (id === 'beethoven-motive' ? 4 : id === 'melody-question' ? 6 : 0),
  );
  const [stage, setStage] = useState(1);
  const [listened, setListened] = useState(false);
  const [history, setHistory] = useState<MusicState[]>([]);
  const [result, setResult] = useState<ReturnType<typeof feedback> | null>(null);

  function edit(patch: Partial<MusicState>, interrupt = true) {
    if (interrupt) stop();
    setHistory((h) => [...h.slice(-19), state]);
    setState((s) => ({ ...s, ...patch }));
    setDirty(true);
    setSaved('Есть несохранённые изменения');
    setResult(null);
    setStage(2);
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    stop();
    setState(previous);
    setHistory((h) => h.slice(0, -1));
    setDirty(true);
    setSaved('Есть несохранённые изменения');
    setResult(null);
  }

  const audition = (midis: number[], gain = 0.8) =>
    void play(
      {
        events: midis.map((midi) => ({ midi, beat: 0, duration: 0.7, gain })),
        beats: 1,
        stepBeats: 1,
      },
      'Выбранный звук',
      undefined,
      true,
    );
  const markHeard = (i: number) => {
    setState((s) => ({ ...s, heard: [...new Set([...s.heard, i])] }));
    setDirty(true);
    setSaved('Есть несохранённые изменения');
    setResult(null);
    setListened(true);
  };
  const listening = !!style || id === 'timbre-register';
  const missing = [0, 1, 2].filter((i) => !state.heard.includes(i));
  function listenRemaining() {
    const queue = [...missing];
    const next = () => {
      const i = queue.shift();
      if (i === undefined) return;
      const score = style ? style.options[i].score : scoreFor(id, state, false, i);
      const label = style ? style.options[i].label : registerNames[i];
      void play(score, label, () => {
        markHeard(i);
        next();
      });
    };
    next();
  }

  if (loading) return <p role="status">Открываем упражнение…</p>;
  if (loadError) return <p role="alert">{loadError} Закройте задание и откройте снова.</p>;
  const own = scoreFor(id, state, false, state.registerChoice < 0 ? 1 : state.registerChoice);
  const reference = scoreFor(id, state, true);
  const comparison = playing === 'Сравнение';
  const referencePlaying =
    playing === 'Образец' || (comparison && step >= 0 && step < reference.beats);
  const ownStep =
    playing === 'Моя версия'
      ? step
      : comparison && step >= reference.beats + 2
        ? Math.floor((step - reference.beats - 2) / own.stepBeats)
        : -1;
  const editable = composition?.editable ?? (id === 'beethoven-motive' ? [4, 5, 6] : [6, 7]);
  const exampleNotes =
    composition?.example ?? (id === 'beethoven-motive' ? [60, 62, 64, 0, 60, 62, 64, 0] : question);
  const pianoNotes =
    composition?.keys ??
    (id === 'beethoven-motive' ? [60, 62, 64, 65, 66, 67, 69, 71, 72] : [60, 62, 64, 65, 67]);
  const chooseNote = (note: number) => {
    const notes = [...state.notes];
    notes[selected] = note;
    edit({ notes });
    if (note) audition([note]);
  };
  return (
    <section className="music-workshop guided-workshop" aria-label={lesson.title}>
      <header className="lesson-heading">
        <p>{lesson.goal}</p>
        <span className="piano-badge">
          ● Фортепиано <small>Записи Salamander / Yamaha C5</small>
        </span>
      </header>
      <ol className="lesson-steps" aria-label="Порядок работы">
        {['Послушайте', listening ? 'Выберите' : 'Соберите', 'Сравните'].map((title, i) => (
          <li
            key={title}
            className={stage === i + 1 ? 'step-current' : ''}
            aria-current={stage === i + 1 ? 'step' : undefined}
          >
            <span>{i === 0 && listened ? '✓' : `0${i + 1}`}</span>
            {title}
          </li>
        ))}
      </ol>
      <div className="listen-card">
        <div>
          <strong>01 / Услышьте образец</strong>
          <p>{lesson.listen}</p>
        </div>
        <button
          disabled={saving}
          onClick={() => {
            setStage(1);
            void play(
              id === 'harmony-home' ? bassScore : reference,
              id === 'harmony-home' ? 'Заданный бас' : 'Образец',
              () => setListened(true),
            );
          }}
        >
          ▶ {id === 'harmony-home' ? 'Слушать бас' : 'Слушать образец'}
        </button>
      </div>
      <div className="editor-heading">
        <div>
          <span>02 / Ваша работа</span>
          <p>{lesson.action}</p>
        </div>
        <button
          disabled={saving || !history.length}
          onClick={undo}
          aria-label="Отменить последнее изменение"
        >
          ↶ Отменить
        </button>
      </div>
      {listening && (
        <div className="listen-card listening-progress">
          <div>
            <strong>Прослушано {3 - missing.length}/3</strong>
            <p role="status">
              {missing.length
                ? `Осталось: ${missing.map((i) => (style ? String.fromCharCode(65 + i) : registerNames[i])).join(', ')}. Выбор ответа не останавливает звук.`
                : state.registerChoice < 0
                  ? 'Все варианты прослушаны. Выберите ответ.'
                  : playing
                    ? 'Дождитесь окончания звука или нажмите «Стоп».'
                    : 'Можно проверить ответ.'}
            </p>
          </div>
          <button disabled={saving || !!playing || !missing.length} onClick={listenRemaining}>
            {missing.length === 3
              ? '▶ Слушать A → B → C'
              : missing.length
                ? '▶ Дослушать оставшиеся'
                : '✓ Все прослушаны'}
          </button>
        </div>
      )}
      <fieldset className="instrument-panel" disabled={saving}>
        <legend>
          {style
            ? 'Прослушайте варианты → выберите ответ'
            : isMelody(id)
              ? 'Выберите место → нажмите клавишу'
              : isRhythm(id)
                ? 'Нажмите на начало группы'
                : 'Выберите место → добавьте музыкальный материал'}
        </legend>
        {style && (
          <StyleOptions
            style={style}
            state={state}
            playing={playing}
            step={step}
            stop={stop}
            play={play}
            markHeard={markHeard}
            edit={edit}
          />
        )}
        {isMelody(id) && (
          <MelodyEditor
            id={id}
            state={state}
            composition={composition}
            referencePlaying={referencePlaying}
            exampleNotes={exampleNotes}
            step={step}
            ownStep={ownStep}
            editable={editable}
            selected={selected}
            setSelected={setSelected}
            setStage={setStage}
            pianoNotes={pianoNotes}
            chooseNote={chooseNote}
          />
        )}
        {id === 'harmony-home' && (
          <HarmonyEditor
            state={state}
            selected={selected}
            ownStep={ownStep}
            setSelected={setSelected}
            edit={edit}
            audition={audition}
          />
        )}
        {isRhythm(id) && (
          <RhythmEditor id={id} state={state} ownStep={ownStep} edit={edit} audition={audition} />
        )}
        {id === 'form-return' && (
          <FormEditor
            id={id}
            state={state}
            selected={selected}
            ownStep={ownStep}
            setSelected={setSelected}
            play={play}
            edit={edit}
          />
        )}
        {id === 'timbre-register' && (
          <RegisterEditor
            id={id}
            state={state}
            playing={playing}
            stop={stop}
            play={play}
            markHeard={markHeard}
            edit={edit}
          />
        )}
      </fieldset>
      <div className="workshop-player">
        <div className="player-buttons">
          <button
            className="play-primary"
            disabled={saving || (!!style && state.registerChoice < 0)}
            onClick={() =>
              void play(own, 'Моя версия', () => {
                if (listening && state.registerChoice >= 0) markHeard(state.registerChoice);
              })
            }
          >
            ▶ {style ? 'Выбранный вариант' : 'Моя версия'}
          </button>
          <button disabled={!playing} onClick={stop}>
            ■ Стоп
          </button>
          {id !== 'timbre-register' && (
            <button
              disabled={saving || (!!style && state.registerChoice < 0)}
              onClick={() => {
                setStage(3);
                void play(compareScores(reference, own), 'Сравнение', () => {
                  if (listening && state.registerChoice >= 0) markHeard(state.registerChoice);
                });
              }}
            >
              ⇄ Образец → {style ? 'выбранный вариант' : 'моя версия'}
            </button>
          )}
        </div>
        <div className="audio-status">
          <meter aria-label="Уровень звукового сигнала" min={0} max={0.15} value={level} />
          <span role="status">
            {sampleLoading ||
              (comparison
                ? step < 0
                  ? 'Начинаем сравнение'
                  : step < reference.beats
                    ? 'Сейчас: образец'
                    : step < reference.beats + 2
                      ? 'Пауза — дальше ваша версия'
                      : 'Сейчас: ваша версия'
                : playing
                  ? `Играет: ${playing}`
                  : 'Фортепиано готово к прослушиванию')}
          </span>
        </div>
      </div>
      {error && (
        <p className="music-feedback" role="alert">
          {error}
        </p>
      )}
      <details className="sound-settings">
        <summary>Темп, громкость и метроном</summary>
        <div className="sound-transport">
          <label>
            Темп{' '}
            <input
              aria-label="Темп"
              type="range"
              min="50"
              max="160"
              value={state.tempo}
              disabled={saving}
              onChange={(e) => edit({ tempo: +e.target.value })}
            />
            <output>{state.tempo} BPM</output>
          </label>
          <label>
            Громкость{' '}
            <input
              aria-label="Громкость"
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => {
                setVolume(+e.target.value / 100);
              }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={metro}
              onChange={(e) => {
                stop();
                setMetro(e.target.checked);
              }}
            />
            Метроном
          </label>
          {id === 'timbre-register' && (
            <label>
              Окраска фортепиано
              <select
                value={state.tone}
                disabled={saving}
                onChange={(e) => edit({ tone: e.target.value as Tone, heard: [] })}
              >
                <option value="soft">Естественная</option>
                <option value="reed">Приглушённая</option>
                <option value="bell">Яркая</option>
              </select>
            </label>
          )}
        </div>
      </details>
      <details className="lesson-hint">
        <summary>Нужна подсказка?</summary>
        <p>{lesson.hint}</p>
      </details>
      <div className="lesson-finish">
        <div>
          <span>03 / Сравните и сохраните</span>
          <p>
            {listening && missing.length
              ? `Для проверки дослушайте: ${missing.map((i) => (style ? String.fromCharCode(65 + i) : registerNames[i])).join(', ')}.`
              : listening && state.registerChoice < 0
                ? 'Выберите один из вариантов выше.'
                : playing
                  ? 'Дождитесь окончания звука или нажмите «Стоп».'
                  : result?.ok
                    ? 'Ответ проверен. Можно сохранить работу.'
                    : 'Нажмите «Проверить себя», чтобы получить результат.'}
          </p>
        </div>
        <button
          disabled={
            saving || !!playing || (listening && (missing.length > 0 || state.registerChoice < 0))
          }
          onClick={() => {
            setStage(3);
            setResult(feedback(id, state));
          }}
        >
          Проверить себя
        </button>
        <button className="save-music" disabled={saving || !!playing} onClick={() => void save()}>
          {saving ? 'Сохраняем…' : 'Сохранить работу'}
        </button>
      </div>
      {result && (
        <p className={`music-feedback ${result.ok ? 'passed' : ''}`} role="status">
          {result.ok ? '✓ ' : ''}
          {result.text}
        </p>
      )}
      <p className="music-caption" role="status">
        {saved || 'Работа сохраняется в вашем аккаунте.'}
        {dirty ? ' Сохраните перед закрытием.' : ''}
      </p>
      <details className="method-note">
        <summary>Об упражнении и звуке</summary>
        <p>
          {style
            ? style.explanation
            : (composition?.method ??
              lessons[id]?.method ??
              'Учебная модель Forma: слушание, изменение одного параметра и сравнение результата.')}{' '}
          Проверка оценивает условия, а не художественное качество.
        </p>
        {!style && !composition && (
          <>
            <p>
              Опора для заданий с басом и мотивом: А. С. Аренский, «Сборник задач (1000) для
              практического изучения гармонии». Интерфейс и короткие примеры разработаны для Forma;
              это не полный курс Аренского.
            </p>
            <a
              href="https://partimenti.org/schemas/collections/motifs/arensky_motifs.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Посмотреть источник ↗
            </a>
          </>
        )}
        <p>
          Salamander Grand Piano · Alexander Holm · CC BY 3.0. Записи фортепиано с транспозицией и
          обработкой при воспроизведении.{' '}
          <a href="/audio/piano/ATTRIBUTION.md" target="_blank" rel="noreferrer">
            Источник и лицензия ↗
          </a>
        </p>
      </details>
    </section>
  );
}
