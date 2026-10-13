import type { MusicState } from './model';
import { chordInfo } from './lessons';
import { bassScore, chordNotes } from './model';

type Edit = (patch: Partial<MusicState>, interrupt?: boolean) => void;
type Props = {
  state: MusicState;
  selected: number;
  ownStep: number;
  setSelected: (i: number) => void;
  edit: Edit;
  audition: (notes: number[], gain?: number) => void;
};
export default function HarmonyEditor({
  state,
  selected,
  ownStep,
  setSelected,
  edit,
  audition,
}: Props) {
  return (
    <>
      <div className="bass-route" aria-label="Заданный бас">
        {['До', 'Фа', 'Соль', 'До'].map((n, i) => (
          <div key={i}>
            <small>Такт {i + 1} · бас</small>
            <strong>{n}</strong>
            <span>↓</span>
          </div>
        ))}
      </div>
      <div className="chord-route">
        {state.chords.map((c, i) => (
          <button
            key={i}
            aria-label={`Такт ${i + 1}: ${chordInfo[c].name}`}
            aria-pressed={selected === i}
            className={`${selected === i ? 'slot-selected' : ''} ${ownStep === i ? 'slot-playing' : ''}`}
            onClick={() => setSelected(i)}
          >
            <small>{chordInfo[c].degree}</small>
            <strong>{chordInfo[c].name}</strong>
            <span>изменить</span>
          </button>
        ))}
      </div>
      <p className="selection-caption">Аккорд для такта {selected + 1}</p>
      <div className="chord-palette">
        {['C', 'F', 'G'].map((c) => (
          <button
            key={c}
            aria-pressed={state.chords[selected] === c}
            onClick={() => {
              const chords = [...state.chords];
              chords[selected] = c;
              edit({ chords });
              audition([bassScore.events[selected].midi, ...chordNotes[c].slice(1)]);
            }}
          >
            <b>{chordInfo[c].degree}</b>
            <strong>{chordInfo[c].name}</strong>
            <small>{chordInfo[c].notes}</small>
            <span>Выбрать и послушать</span>
          </button>
        ))}
      </div>
      <p className="music-caption">
        Римские цифры — ступени лада. Бас закреплён; меняются три верхних голоса.
      </p>
    </>
  );
}
