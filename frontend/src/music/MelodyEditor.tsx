import type { MusicState } from './model';
import type { CompositionExercise } from './compositionExercises';
import { Notation, PianoKeys } from './Notation';
import { noteNames } from './model';

type Props = {
  id: string;
  state: MusicState;
  composition?: CompositionExercise;
  referencePlaying: boolean;
  exampleNotes: number[];
  step: number;
  ownStep: number;
  editable: number[];
  selected: number;
  setSelected: (i: number) => void;
  setStage: (i: number) => void;
  pianoNotes: number[];
  chooseNote: (n: number) => void;
};
export default function MelodyEditor({
  id,
  state,
  composition,
  referencePlaying,
  exampleNotes,
  step,
  ownStep,
  editable,
  selected,
  setSelected,
  setStage,
  pianoNotes,
  chooseNote,
}: Props) {
  return (
    <>
      <div className="score-paper">
        <div className="score-caption">
          <span>{referencePlaying ? 'Образец' : 'Ваш вариант'}</span>
          <span>
            {composition
              ? 'Учебная модель'
              : id === 'beethoven-motive'
                ? 'Перенос мотива'
                : 'До мажор'}{' '}
            · 4/4
          </span>
        </div>
        {referencePlaying && composition?.hideReference ? (
          <p className="dictation-listening" role="status">
            ♫ Слушайте — ноты образца скрыты
          </p>
        ) : (
          <Notation
            notes={referencePlaying ? exampleNotes : state.notes}
            active={referencePlaying ? step : ownStep}
            editable={referencePlaying ? [] : editable}
          />
        )}
      </div>
      <div className="note-slots">
        {state.notes.map((n, i) => (
          <button
            key={i}
            disabled={!editable.includes(i)}
            className={`${editable.includes(i) ? 'slot-editable' : 'slot-given'} ${selected === i ? 'slot-selected' : ''} ${ownStep === i ? 'slot-playing' : ''}`}
            aria-pressed={selected === i}
            aria-label={`Место ${i + 1}: ${noteNames[n]}`}
            onClick={() => {
              setSelected(i);
              setStage(2);
            }}
          >
            <small>{i + 1}</small>
            <strong>{n ? noteNames[n] : editable.includes(i) ? '?' : '—'}</strong>
            <span>{editable.includes(i) ? 'изменить' : n ? 'дано' : 'пауза'}</span>
          </button>
        ))}
      </div>
      <div className="keyboard-heading">
        <strong>Нота для места {selected + 1}</strong>
        <span>Клавиша сразу прозвучит</span>
      </div>
      <PianoKeys notes={pianoNotes} selected={state.notes[selected]} onChoose={chooseNote} />
      <button className="rest-button" onClick={() => chooseNote(0)}>
        Убрать ноту
      </button>
    </>
  );
}
