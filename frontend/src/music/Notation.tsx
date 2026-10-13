import { noteNames } from './model';

const staffY: Record<number, number> = {
  60: 94,
  61: 94,
  62: 88,
  63: 82,
  64: 82,
  65: 76,
  66: 76,
  67: 70,
  68: 70,
  69: 64,
  70: 58,
  71: 58,
  72: 52,
};
const accidentals: Record<number, string> = { 61: '♯', 63: '♭', 66: '♯', 68: '♯', 70: '♭' };
const blackKeys = [61, 63, 66, 68, 70];
export function Notation({
  notes,
  active = -1,
  label = 'Ноты',
  editable = [],
}: {
  notes: number[];
  active?: number;
  label?: string;
  editable?: number[];
}) {
  return (
    <svg
      className="notation"
      viewBox="0 0 680 132"
      role="img"
      aria-label={`${label}: ${notes.map((n) => noteNames[n] ?? 'нота').join(', ')}`}
    >
      {[34, 46, 58, 70, 82].map((y) => (
        <line key={y} x1="22" x2="660" y1={y} y2={y} className="staff-line" />
      ))}
      <text x="22" y="76" fontSize="48" className="clef">
        𝄞
      </text>
      <line x1="364" x2="364" y1="34" y2="82" className="bar-line" />
      {notes.map((n, i) => {
        const x = 90 + i * 76;
        const y = staffY[n] ?? 70;
        return (
          <g
            key={i}
            className={`${editable.includes(i) ? 'editable-note' : ''} ${active === i ? 'sounding-note' : ''}`}
          >
            {active === i && (
              <rect x={x - 25} y="15" width="50" height="96" rx="4" className="note-highlight" />
            )}
            {n ? (
              <>
                {[60, 61].includes(n) && (
                  <line x1={x - 14} x2={x + 14} y1="94" y2="94" className="ledger" />
                )}
                <ellipse cx={x} cy={y} rx="8" ry="5.5" transform={`rotate(-18 ${x} ${y})`} />
                <line x1={x + 7} x2={x + 7} y1={y} y2={y - 31} className="note-stem" />
                {accidentals[n] && (
                  <text x={x - 22} y={y + 5}>
                    {accidentals[n]}
                  </text>
                )}
              </>
            ) : (
              <text x={x - 6} y="66" className="rest-mark">
                {editable.includes(i) ? '?' : '𝄽'}
              </text>
            )}
            <text x={x} y="124" textAnchor="middle" className="note-name">
              {noteNames[n] ?? '—'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PianoKeys({
  notes,
  selected,
  onChoose,
  disabled = false,
}: {
  notes: number[];
  selected: number;
  onChoose: (note: number) => void;
  disabled?: boolean;
}) {
  const whiteCount = notes.filter((v) => !blackKeys.includes(v)).length;
  return (
    <div className="piano-keys" role="group" aria-label="Клавиши фортепиано">
      {notes.map((n, i) => (
        <button
          type="button"
          disabled={disabled}
          key={n}
          style={
            blackKeys.includes(n)
              ? whiteCount
                ? {
                    left: `${Math.max(4, Math.min(96, (notes.slice(0, i).filter((v) => !blackKeys.includes(v)).length / whiteCount) * 100))}%`,
                  }
                : { position: 'static', transform: 'none', width: '100%' }
              : undefined
          }
          className={`${blackKeys.includes(n) ? 'black-key' : ''} ${selected === n ? 'key-selected' : ''}`}
          aria-pressed={selected === n}
          aria-label={`Нота ${noteNames[n]}`}
          onClick={() => onChoose(n)}
        >
          <span>{noteNames[n]}</span>
        </button>
      ))}
    </div>
  );
}
