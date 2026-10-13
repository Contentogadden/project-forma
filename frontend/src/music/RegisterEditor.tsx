import type { MusicState } from './model';
import type { useMusicPlayback } from './useMusicPlayback';
import { registerNames, scoreFor } from './model';

type Edit = (patch: Partial<MusicState>, interrupt?: boolean) => void;
type Play = ReturnType<typeof useMusicPlayback>['play'];
type Props = {
  id: string;
  state: MusicState;
  playing: string;
  stop: () => void;
  play: Play;
  markHeard: (i: number) => void;
  edit: Edit;
};
export default function RegisterEditor({ id, state, playing, stop, play, markHeard, edit }: Props) {
  return (
    <div className="register-grid">
      {registerNames.map((name, i) => (
        <article key={name} className={state.registerChoice === i ? 'register-selected' : ''}>
          <span className="register-drawing" aria-hidden="true">
            {['▂ ▃ ▂ ▁', '▄ ▅ ▄ ▃', '▆ ▇ ▆ ▅'][i]}
          </span>
          <strong>{name}</strong>
          <span>{['На октаву ниже', 'Исходная высота', 'На октаву выше'][i]}</span>
          <button
            onClick={() =>
              playing === name
                ? stop()
                : void play(scoreFor(id, state, false, i), name, () => markHeard(i))
            }
          >
            {playing === name ? '■ Остановить' : `▶ Слушать ${name.toLowerCase()}`}
          </button>
          <button
            aria-pressed={state.registerChoice === i}
            onClick={() => edit({ registerChoice: i }, false)}
          >
            {state.registerChoice === i ? '✓ Мой выбор' : 'Выбрать'}
          </button>
          <small>
            {state.heard.includes(i)
              ? '✓ Прослушан'
              : playing === name
                ? 'Слушаем…'
                : 'Ещё не прослушан'}
          </small>
        </article>
      ))}
    </div>
  );
}
