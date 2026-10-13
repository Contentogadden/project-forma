import paths from '../../../src/main/resources/catalog/composer-paths.json' with { type: 'json' };
import type { CompositionExercise } from './compositionExercises.ts';
import type { Score } from './model.ts';
import type { StyleExercise } from './styleExercises.ts';
export const composerPaths = paths;
const keys = Array.from({ length: 13 }, (_, i) => 60 + i);
const line = (notes: number[]): Score => ({
  events: notes.flatMap((midi, beat) => (midi ? [{ midi, beat, duration: 0.85 }] : [])),
  beats: 8,
  stepBeats: 1,
});
export const pathCompositionExercises: Record<string, CompositionExercise> = Object.fromEntries(
  paths
    .filter((p) => p.kind !== 'recognize')
    .map((p) => [
      p.id,
      {
        title: p.title,
        goal: p.goal,
        hint: p.hint,
        expected: [...p.notes],
        hideReference: p.kind === 'dictation',
        initial: p.notes.map((n, i) => (p.editable.includes(i) ? 0 : n)),
        example: [...p.reference],
        editable: [...p.editable],
        keys: [...keys],
        action: `Выберите место ${p.editable.map((i) => i + 1).join(', ')}, затем нажмите клавишу.`,
        listen:
          p.kind === 'dictation'
            ? 'Запомните пропущенные звуки. Образец можно повторить.'
            : p.kind === 'retrograde'
              ? 'Это исходная линия. Ваша версия должна идти в обратном порядке.'
              : 'Это исходный мотив, повторённый без переноса. Во второй половине вашей версии высота изменится.',
        method:
          'Оригинальная учебная модель Forma. Слуховая память и преобразование одного параметра; не цитата из произведения и не оценка подлинности стиля.',
        accept: (notes: number[]) => p.editable.every((i) => notes[i] === p.notes[i]),
        success: 'Все высоты на своих местах. Послушайте результат и сравните с исходной линией.',
      },
    ]),
);
export const pathListeningExercises: Record<string, StyleExercise> = Object.fromEntries(
  paths
    .filter((p) => p.kind === 'recognize')
    .map((p, index) => {
      const reference = line(p.reference);
      const answer = index % 3;
      const wrong = [1, 6].map((slot) =>
        line(p.notes.map((n, i) => (i === slot ? n + (n === 72 ? -1 : 1) : n))),
      );
      const options = [...wrong];
      options.splice(answer, 0, line(p.notes));
      return [
        p.id,
        {
          title: p.title,
          goal: p.goal,
          hint: p.hint,
          reference,
          answer,
          options: options.map((score, i) => ({ label: `Вариант ${'ABC'[i]}`, score })),
          action: 'Дослушайте варианты и выберите линию без подмены нот.',
          listen: 'Запомните восемь нот образца. Во всех вариантах одинаковые ритм и темп.',
          explanation:
            'В правильном варианте сохранены все высоты. В двух других заменена одна нота.',
        },
      ];
    }),
);
export const pathFormats: Record<string, string> = Object.fromEntries(
  paths.map((p) => [
    p.id,
    (
      {
        dictation: 'Диктант',
        transpose: 'Перенос',
        retrograde: 'Ракоход',
        recognize: 'На слух',
      } as Record<string, string>
    )[p.kind],
  ]),
);
