import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import { usePendingChanges } from './PendingChanges';

type Provider = 'GEMINI' | 'GROQ';
type Settings = {
  enabled: boolean;
  configured: boolean;
  model: string;
  provider: Provider;
  geminiConfigured: boolean;
  groqConfigured: boolean;
  geminiModel: string;
  groqModel: string;
};
const request = <T,>(path = '', method = 'GET', body?: unknown) =>
  api<T>(path, method, body, '/api/admin/ai-settings');
export default function AiSettings() {
  const [saved, setSaved] = useState<Settings | null>(null);
  const [key, setKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash-lite');
  const [provider, setProvider] = useState<Provider>('GEMINI');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  usePendingChanges(
    !!saved &&
      (!!key || provider !== saved.provider || enabled !== saved.enabled || model !== saved.model),
  );
  const apply = (s: Settings) => {
    setSaved(s);
    setProvider(s.provider);
    setEnabled(s.enabled);
    setModel(s.model);
    setKey('');
  };
  useEffect(() => {
    let active = true;
    request<Settings>()
      .then((s) => {
        if (active) apply(s);
      })
      .catch(() => {
        if (active) setError('Не удалось загрузить настройки.');
      });
    return () => {
      active = false;
    };
  }, []);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить действие.');
    } finally {
      setBusy(false);
    }
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      apply(await request<Settings>('', 'PUT', { key: key || null, enabled, model, provider }));
      setMessage('Настройки сохранены.');
    });
  };
  const configured =
    !!saved && (provider === 'GROQ' ? saved.groqConfigured : saved.geminiConfigured);
  const name = provider === 'GROQ' ? 'Groq' : 'Gemini';
  const changeProvider = (p: Provider) => {
    setProvider(p);
    setKey('');
    setEnabled(false);
    setModel(p === 'GROQ' ? saved!.groqModel : saved!.geminiModel);
    setError('');
    setMessage('');
  };
  const dirty =
    !!key ||
    (!!saved &&
      (provider !== saved.provider || enabled !== saved.enabled || model !== saved.model));
  return (
    <section className="ai-settings">
      <div className="class-heading">
        <h3>ИИ-подсказки</h3>
        <span>{configured ? 'Ключ сохранён' : 'Не подключён'}</span>
      </div>
      <p>Подсказки для практики · только для пользователей 18+</p>
      {error && (
        <p className="class-error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {saved && (
        <form onSubmit={save} className="ai-settings-form">
          <label>
            Провайдер
            <select
              value={provider}
              onChange={(e) => changeProvider(e.target.value as Provider)}
              disabled={busy}
            >
              <option value="GROQ">Groq</option>
              <option value="GEMINI">Gemini</option>
            </select>
          </label>
          <label>
            API-ключ
            <input
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              maxLength={256}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={
                configured ? 'Оставьте пустым, чтобы сохранить текущий' : `Вставьте ключ ${name}`
              }
              disabled={busy}
            />
          </label>
          <label>
            Модель
            {provider === 'GROQ' ? (
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={busy}>
                <option value="openai/gpt-oss-20b">GPT-OSS 20B</option>
                <option value="openai/gpt-oss-120b">GPT-OSS 120B</option>
              </select>
            ) : (
              <input
                value={model}
                maxLength={90}
                onChange={(e) => setModel(e.target.value)}
                disabled={busy}
                required
              />
            )}
          </label>
          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={busy || (!configured && !key)}
            />
            ИИ-подсказки включены
          </label>
          <div className="ai-actions">
            <button className="class-primary" disabled={busy || !dirty}>
              Сохранить
            </button>
            <button
              type="button"
              disabled={busy || !configured || dirty}
              onClick={() =>
                void run(async () => {
                  const result = await request<{ connected: boolean; message: string }>(
                    '/test',
                    'POST',
                  );
                  if (result.connected) setMessage(result.message);
                  else setError(result.message);
                })
              }
            >
              Проверить подключение
            </button>
            {saved.configured && provider === saved.provider && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm('Удалить ключ выбранного провайдера и выключить ИИ?'))
                    void run(async () => {
                      apply(await request<Settings>('', 'DELETE'));
                      setMessage('Ключ удалён. ИИ выключен.');
                    });
                }}
              >
                Удалить ключ
              </button>
            )}
          </div>
          {provider === 'GROQ' && (
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
              Создать ключ Groq ↗
            </a>
          )}
          <small>
            Сохранённый ключ не показывается. Ключи провайдеров сохраняются раздельно. Проверка
            расходует квоту API. Для Groq используйте Free-тариф: приложение не управляет оплатой
            аккаунта. При выключенном ИИ остаются обычные подсказки.
          </small>
        </form>
      )}
    </section>
  );
}
