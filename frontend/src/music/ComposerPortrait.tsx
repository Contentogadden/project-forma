import { useState } from 'react';
import { composers } from './composers';
export default function ComposerPortrait({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const symbolic = !composers[id]?.source || failed;
  return (
    <div className={`composer-portrait ${symbolic ? 'portrait-fallback' : ''}`}>
      {!symbolic && (
        <img
          src={`/composers/${id}.jpg`}
          alt={`Портрет: ${name}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      {symbolic && (
        <span aria-label={`Визуальная карточка: ${name}`}>{name.split(' ').at(-1)}</span>
      )}
      <span className="portrait-grid" aria-hidden="true" />
    </div>
  );
}
