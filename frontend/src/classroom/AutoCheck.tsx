import { useState } from 'react';
import { api, type CheckResult, type Work } from './api';

export function AutoCheck({ work, notes }: { work: Work; notes: number[] }) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState('');
  const current = JSON.stringify([work.version, notes]);
  let resultTitle = 'Ответ не завершён';
  if (result?.complete) resultTitle = 'Попробуйте ещё раз';
  if (result?.passed) resultTitle = '✓ Условие выполнено';
  async function check() {
    setBusy(true);
    setError('');
    try {
      const checkedResult = await api<CheckResult>(`/works/${work.id}/check`, 'POST', {
        version: work.version,
        notes,
        submit: false,
      });
      setResult(checkedResult);
      setChecked(current);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось проверить ответ');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="class-auto-check">
      <button className="class-primary" disabled={busy} onClick={check}>
        {busy ? 'Проверяем…' : 'Проверить себя'}
      </button>
      <div role="status" aria-live="polite">
        {result && checked === current && (
          <>
            <strong>{resultTitle}</strong>
            <p>{result.message}</p>
            {result.incorrectSlots.length > 0 && (
              <small>Проверьте доли: {result.incorrectSlots.map((i) => i + 1).join(', ')}.</small>
            )}
          </>
        )}
        {result && checked !== current && <p>Ответ изменён. Проверьте новую версию.</p>}
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
