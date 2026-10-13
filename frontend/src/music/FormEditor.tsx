import type { MusicState } from './model';
import type { useMusicPlayback } from './useMusicPlayback';
import { scoreFor } from './model';

type Edit = (patch: Partial<MusicState>, interrupt?: boolean) => void;
type Play = ReturnType<typeof useMusicPlayback>['play'];
type Props = {
  id: string;
  state: MusicState;
  selected: number;
  ownStep: number;
  setSelected: (i: number) => void;
  play: Play;
  edit: Edit;
};
export default function FormEditor({
  id,
  state,
  selected,
  ownStep,
  setSelected,
  play,
  edit,
}: Props) {
  return (
    <>
      <div className="form-route">
        {state.order.map((b, i) => (
          <button
            key={i}
            aria-label={`Часть ${i + 1}: ${b}`}
            aria-pressed={selected === i}
            className={`${selected === i ? 'slot-selected' : ''} ${ownStep === i ? 'slot-playing' : ''}`}
            onClick={() => setSelected(i)}
          >
            <small>{['Начало', 'Середина', 'Возвращение'][i]}</small>
            <strong>{b}</strong>
            <span>изменить</span>
          </button>
        ))}
      </div>
      <p className="selection-caption">Фрагмент для части {selected + 1}</p>
      <div className="fragment-library">
        {['A', 'B', 'A′'].map((b) => (
          <article key={b}>
            <button onClick={() => void play(scoreFor(id, state, false, 1, b), `Фрагмент ${b}`)}>
              ▶ {b}
              <small>{b === 'A' ? 'Тема' : b === 'B' ? 'Контраст' : 'Тема октавой выше'}</small>
            </button>
            <button
              onClick={() => {
                const order = [...state.order];
                order[selected] = b;
                edit({ order });
              }}
            >
              Добавить {b}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
