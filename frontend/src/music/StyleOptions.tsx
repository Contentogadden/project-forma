import type { MusicState } from './model';
import type { useMusicPlayback } from './useMusicPlayback';
import { eventLabel, type StyleExercise } from './styleExercises';

type Edit = (patch: Partial<MusicState>, interrupt?: boolean) => void;
type Play = ReturnType<typeof useMusicPlayback>['play'];
type Props = {
  style: StyleExercise;
  state: MusicState;
  playing: string;
  step: number;
  stop: () => void;
  play: Play;
  markHeard: (i: number) => void;
  edit: Edit;
};
export default function StyleOptions({
  style,
  state,
  playing,
  step,
  stop,
  play,
  markHeard,
  edit,
}: Props) {
  return (
    <div className="style-options">
      {style.options.map((option, i) => (
        <article key={i} className={state.registerChoice === i ? 'style-selected' : ''}>
          <h4>{option.label}</h4>
          <small>Высота ↑ · Время →</small>
          <svg
            viewBox="0 0 320 140"
            role="img"
            aria-label={`Звуковая карта ${option.label}: высота вверх, время вправо`}
          >
            {[0, 2, 4, 6, 8].map((beat) => (
              <line
                key={beat}
                x1={12 + beat * 36}
                x2={12 + beat * 36}
                y1="12"
                y2="118"
                stroke="#697362"
                strokeDasharray="2 5"
              />
            ))}
            {option.score.events.map((event, j) => (
              <rect
                key={j}
                x={12 + event.beat * 36}
                y={112 - (event.midi - 36) * 2}
                width={Math.max(4, event.duration * 36)}
                height="5"
                rx="2"
                fill={
                  playing === option.label && Math.floor(event.beat) === step
                    ? '#f3c990'
                    : event.midi < 60
                      ? '#9fb4d6'
                      : '#b4d997'
                }
              >
                <title>{eventLabel(event)}</title>
              </rect>
            ))}
            <text x="12" y="136" fill="#bcc5b5" fontSize="10">
              Время →
            </text>
          </svg>
          <button
            aria-label={`Слушать ${option.label}`}
            onClick={() =>
              playing === option.label
                ? stop()
                : void play(option.score, option.label, () => markHeard(i))
            }
          >
            {playing === option.label ? '■ Остановить' : '▶ Слушать'}
          </button>
          <button
            aria-label={`Выбрать ${option.label}`}
            aria-pressed={state.registerChoice === i}
            onClick={() => edit({ registerChoice: i }, false)}
          >
            {state.registerChoice === i ? '✓ Выбран' : 'Выбрать'}
          </button>
          <small>
            {state.heard.includes(i)
              ? '✓ Прослушан'
              : playing === option.label
                ? 'Слушаем…'
                : 'Ещё не прослушан'}
          </small>
        </article>
      ))}
    </div>
  );
}
