import { useState, type FormEvent } from 'react';
import { noteNames } from '../music/model';
import ConfirmLeave from './ConfirmLeave';
import MelodyEditor from './MelodyEditor';
import { usePendingChanges } from './PendingChanges';
import {
  api,
  condition,
  motivePreset,
  pitches,
  preset,
  type ConstructorSeed,
  type Definition,
  type Template,
} from './api';
import './classroom.css';
import { errorText } from './format';

export default function TemplateEditor({
  template,
  source,
  close,
  saved,
}: {
  template?: Template;
  source?: ConstructorSeed['kind'];
  close: () => void;
  saved: (t: Template) => void;
}) {
  const [original] = useState(
    () => template?.definition ?? (source === 'beethoven-motive' ? motivePreset() : preset()),
  );
  const [definition, setDefinition] = useState<Definition>(original);
  const [mode, setMode] = useState<'initial' | 'reference' | 'preview'>('initial');
  const [preview, setPreview] = useState(definition.initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(definition) !== JSON.stringify(original);
  usePendingChanges(dirty || busy);
  const [leaving, setLeaving] = useState(false);
  const patch = (p: Partial<Definition>) => setDefinition((old) => ({ ...old, ...p }));
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const t = await api<Template>(
        template ? `/templates/${template.id}` : '/templates',
        template ? 'PUT' : 'POST',
        template ? { version: template.version, definition } : definition,
      );
      saved(t);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const all = { ...definition, editable: [0, 1, 2, 3, 4, 5, 6, 7], allowed: pitches };
  return (
    <section className="classroom">
      {leaving && <ConfirmLeave cancel={() => setLeaving(false)} leave={close} />}
      <button onClick={() => (dirty ? setLeaving(true) : close())} disabled={busy}>
        ← Мои задания
      </button>
      <div className="class-heading">
        <div>
          <span className="class-eyebrow">Конструктор / мелодия</span>
          <h3>{template ? 'Редактирование шаблона' : 'Новое задание'}</h3>
        </div>
        <span>01 / Слушать → 02 / Создавать → 03 / Сравнивать</span>
      </div>
      <form onSubmit={save} className="class-builder">
        <div className="class-fields">
          <label>
            Название
            <input
              required
              maxLength={120}
              value={definition.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>
          <label>
            Что сделать ученику
            <textarea
              required
              maxLength={1500}
              rows={3}
              value={definition.instruction}
              onChange={(e) => patch({ instruction: e.target.value })}
            />
          </label>
          <label>
            Подсказка
            <textarea
              maxLength={1000}
              rows={2}
              value={definition.hint}
              onChange={(e) => patch({ hint: e.target.value })}
            />
          </label>
          <div className="class-inline">
            <label>
              Темп
              <input
                type="number"
                min={50}
                max={160}
                required
                value={definition.tempo}
                onChange={(e) => patch({ tempo: Number(e.target.value) })}
              />
            </label>
            <label>
              Последняя нота
              <select
                value={definition.lastNote}
                onChange={(e) => patch({ lastNote: Number(e.target.value) })}
              >
                <option value={0}>Свободное окончание</option>
                {definition.allowed.map((n) => (
                  <option key={n} value={n}>
                    {noteNames[n]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Автопроверка
            <select
              value={definition.checkMode ?? 'CONDITIONS'}
              onChange={(e) => patch({ checkMode: e.target.value as Definition['checkMode'] })}
            >
              <option value="CONDITIONS">Свободный ответ: условия и окончание</option>
              <option value="EXACT">Точное воспроизведение образца</option>
              <option value="TRANSPOSE">Перенос интервалов на другую высоту</option>
            </select>
          </label>
          <fieldset>
            <legend>Доступные клавиши</legend>
            <div className="class-checks">
              {pitches.map((n) => (
                <label key={n}>
                  <input
                    type="checkbox"
                    checked={definition.allowed.includes(n)}
                    onChange={(e) =>
                      patch({
                        allowed: e.target.checked
                          ? pitches.filter((p) => p === n || definition.allowed.includes(p))
                          : definition.allowed.filter((p) => p !== n),
                      })
                    }
                  />
                  {noteNames[n]}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="class-help">
            Материал можно менять перед выдачей. Автопроверка использует выбранное правило. Для
            переноса задайте мотив в изменяемых долях образца; ученик сохранит его интервалы на
            другой высоте.
          </p>
        </div>
        <div className="class-score-panel">
          <div className="class-tabs">
            {[
              ['initial', 'Исходные ноты'],
              ['reference', 'Звуковой образец'],
              ['preview', 'Глазами ученика'],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={mode === id}
                onClick={() => {
                  setMode(id as typeof mode);
                  setPreview([...definition.initial]);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'preview' ? (
            <>
              <h4>{definition.title}</h4>
              <p>{definition.instruction}</p>
              <MelodyEditor
                key="preview"
                definition={definition}
                notes={preview}
                onChange={setPreview}
              />
              <p className="class-help">{condition(definition, preview)}</p>
            </>
          ) : (
            <>
              <p>
                {mode === 'initial'
                  ? 'Составьте начало. Пустые изменяемые доли заполнит ученик.'
                  : 'Сыграйте фразу, с которой ученик будет сравнивать свой ответ.'}
              </p>
              <MelodyEditor
                key={mode}
                definition={all}
                notes={definition[mode]}
                onChange={(notes) => patch({ [mode]: notes })}
              />
              {mode === 'initial' && (
                <fieldset>
                  <legend>Какие доли разрешено менять?</legend>
                  <div className="class-checks">
                    {definition.initial.map((_, i) => (
                      <label key={i}>
                        <input
                          type="checkbox"
                          checked={definition.editable.includes(i)}
                          onChange={(e) =>
                            patch({
                              editable: e.target.checked
                                ? [...definition.editable, i].sort()
                                : definition.editable.filter((p) => p !== i),
                            })
                          }
                        />
                        {i + 1}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}
        </div>
        <div className="class-builder-bottom">
          {error && (
            <p className="class-error" role="alert">
              {error}
            </p>
          )}
          <button className="class-primary" disabled={busy}>
            {busy ? 'Сохраняем…' : 'Сохранить и выбрать учеников →'}
          </button>
          <small>Назначение — отдельный шаг. Пока никто не получит задание.</small>
        </div>
      </form>
    </section>
  );
}
