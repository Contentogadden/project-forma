import { useEffect, useRef, useState } from 'react';
import { MusicAudio } from '../music/audio';
import { compareScores, noteNames, type Score } from '../music/model';
import { Notation, PianoKeys } from '../music/Notation';
import '../music/workshop.css';
import { type Definition } from './api';

const score = (notes: number[]): Score => ({
  events: notes.flatMap((midi, beat) => (midi ? [{ midi, beat, duration: 0.85 }] : [])),
  beats: 8,
  stepBeats: 1,
});
export default function MelodyEditor({
  definition,
  notes,
  onChange,
  readOnly = false,
}: {
  definition: Definition;
  notes: number[];
  onChange?: (n: number[]) => void;
  readOnly?: boolean;
}) {
  const engine = useRef<MusicAudio | null>(null);
  const request = useRef(0);
  const [selected, setSelected] = useState(definition.editable[0] ?? 0);
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    engine.current = new MusicAudio();
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      request.current++;
      engine.current?.dispose();
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  function stop() {
    request.current++;
    engine.current?.stop();
    setActive(-1);
    setPlaying(false);
  }
  async function play(mode: 'reference' | 'answer' | 'compare', one?: number) {
    stop();
    const ticket = ++request.current;
    setPlaying(true);
    setMessage('');
    const sound = one
      ? { ...score([one]), beats: 1 }
      : mode === 'reference'
        ? score(definition.reference)
        : mode === 'compare'
          ? compareScores(score(definition.reference), score(notes))
          : score(notes);
    try {
      await engine.current?.play(
        sound,
        definition.tempo,
        'soft',
        0.7,
        false,
        (step) => {
          if (ticket !== request.current) return;
          setActive(
            one
              ? -1
              : mode === 'compare'
                ? step >= 10
                  ? step - 10
                  : -1
                : mode === 'reference'
                  ? -1
                  : step,
          );
        },
        () => {
          if (ticket === request.current) {
            setPlaying(false);
            setMessage('');
          }
        },
        4,
        (loaded, total) => {
          if (ticket === request.current)
            setMessage(loaded < total ? `Загружаем фортепиано: ${loaded}/${total}` : '');
        },
      );
    } catch {
      if (ticket === request.current) {
        setPlaying(false);
        setMessage('Не удалось загрузить звук. Попробуйте ещё раз.');
      }
    }
  }
  function choose(n: number) {
    stop();
    onChange?.(notes.map((value, i) => (i === selected ? n : value)));
    if (n) void play('answer', n);
  }
  const canEdit = !readOnly && definition.editable.includes(selected);
  return (
    <div className="class-melody">
      <div className="class-actions">
        <button type="button" onClick={() => play('reference')}>
          ▶ Образец
        </button>
        <button type="button" onClick={() => play('answer')}>
          ▶ {readOnly ? 'Ответ' : 'Моя версия'}
        </button>
        <button type="button" onClick={() => play('compare')}>
          ⇄ Сравнить
        </button>
        <button type="button" disabled={!playing} onClick={stop}>
          ■ Стоп
        </button>
      </div>
      <Notation notes={notes} active={active} editable={readOnly ? [] : definition.editable} />
      {!readOnly && (
        <>
          <div className="class-slots" role="group" aria-label="Доли мелодии">
            {notes.map((n, i) => (
              <button
                type="button"
                key={i}
                disabled={!definition.editable.includes(i)}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <small>
                  {i + 1}
                  {definition.editable.includes(i) ? '' : ' · задано'}
                </small>
                <b>{noteNames[n]}</b>
              </button>
            ))}
          </div>
          <p className="class-help">
            Выберите долю, затем нажмите клавишу. Серые доли заданы преподавателем.
          </p>
          <PianoKeys
            notes={definition.allowed}
            selected={notes[selected]}
            onChoose={choose}
            disabled={!canEdit}
          />
          <button type="button" disabled={!canEdit} onClick={() => choose(0)}>
            Очистить долю {selected + 1}
          </button>
        </>
      )}
      <p role="status" className="class-help">
        {message || (playing ? 'Звучит фортепиано…' : 'Каждая доля — четверть. Два такта по 4/4.')}
      </p>
    </div>
  );
}
