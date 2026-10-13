import { useEffect, useState } from 'react';
import { getCsrfToken } from '../http.ts';
import { initialState, type MusicState } from './model';

export function useMusicWork(id: string) {
  const [state, setState] = useState<MusicState>(() => initialState(id));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const endpoint = `/api/student/music-work/${id}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (response.status === 204) return;
        if (!response.ok) {
          if (response.status === 401) throw new Error('Сессия закончилась. Войдите снова.');
          throw new Error('Не удалось загрузить работу.');
        }
        const data = await response.json();
        if (data.state.version !== 1)
          throw new Error('Эта работа создана в другой версии редактора.');
        if (!controller.signal.aborted) {
          setState(data.state);
          setSaved('Черновик загружен');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить работу.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [endpoint]);

  async function save() {
    setSaving(true);
    setSaved('Сохраняем…');
    try {
      const csrf = await getCsrfToken();
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
        body: JSON.stringify(state),
      });
      if (!response.ok) throw new Error();
      setDirty(false);
      setSaved('Черновик сохранён');
    } catch {
      setSaved('Не удалось сохранить. Черновик остался в редакторе — попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  }

  return { state, setState, loading, loadError, saved, setSaved, saving, dirty, setDirty, save };
}
