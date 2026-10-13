import type { MusicState } from './model';

type Edit = (patch: Partial<MusicState>, interrupt?: boolean) => void;

type Props = {
  id: string;
  state: MusicState;
  ownStep: number;
  edit: Edit;
  audition: (notes: number[], gain?: number) => void;
};
export default function RhythmEditor({ id, state, ownStep, edit, audition }: Props) {
  return (
    <div className="rhythm-bars">
      {Array.from({ length: id === 'brahms-meter' ? 4 : 2 }, (_, bar) => {
        const count = id === 'brahms-meter' ? 3 : 8;
        return (
          <div className="rhythm-bar" key={bar}>
            <div className="bar-caption">
              <b>Такт {bar + 1}</b>
              <span>
                {id === 'brahms-meter'
                  ? '3/4'
                  : id === 'stravinsky-accent'
                    ? bar === 0
                      ? '3 + 3 + 2'
                      : '2 + 3 + 3'
                    : '1 и 2 и 3 и 4 и'}
              </span>
            </div>
            <div className={`beat-grid ${count === 3 ? 'triple-meter' : ''}`}>
              {state.hits.slice(bar * count, (bar + 1) * count).map((hit, j) => {
                const i = bar * count + j;
                return (
                  <button
                    key={i}
                    aria-label={`Удар ${i + 1}: ${hit === 0 ? 'пауза' : hit === 2 ? 'акцент' : 'обычный'}`}
                    aria-pressed={hit === 2}
                    className={`hit-${hit} ${ownStep === i ? 'playhead' : ''}`}
                    onClick={() => {
                      const hits = [...state.hits];
                      hits[i] = hit === 2 ? 1 : 2;
                      edit({ hits });
                      audition([60], hits[i] === 2 ? 1 : 0.3);
                    }}
                  >
                    <small>
                      {count === 3 ? j + 1 : ['1', 'и', '2', 'и', '3', 'и', '4', 'и'][j]}
                    </small>
                    <b>{hit === 0 ? '—' : hit === 2 ? '›' : '●'}</b>
                    <span>{hit === 0 ? 'пауза' : hit === 2 ? 'сильнее' : 'тише'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
