import { useEffect, useRef } from 'react';
export default function ConfirmLeave({ cancel, leave }: { cancel: () => void; leave: () => void }) {
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    stay.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div className="class-confirm-backdrop">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        aria-describedby="leave-description"
        className="class-confirm"
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel();
          if (e.key === 'Tab') {
            e.preventDefault();
            const buttons = e.currentTarget.querySelectorAll('button');
            (document.activeElement === buttons[0] ? buttons[1] : buttons[0]).focus();
          }
        }}
      >
        <h3 id="leave-title">Изменения не сохранены</h3>
        <p id="leave-description">
          Можно остаться и сохранить работу или выйти, потеряв последние изменения.
        </p>
        <div className="class-actions">
          <button ref={stay} onClick={cancel}>
            Остаться
          </button>
          <button onClick={leave}>Уйти без сохранения</button>
        </div>
      </section>
    </div>
  );
}
