import { pathListeningExercises } from './composerPaths.ts';
import { expandedListeningExercises } from './expandedPractice.ts';
import { listeningExercises } from './listeningExercises.ts';
import type { NoteEvent, Score } from './model';
type Option = { label: string; score: Score };
export type StyleExercise = {
  title: string;
  goal: string;
  action: string;
  listen: string;
  hint: string;
  reference: Score;
  options: Option[];
  answer: number;
  explanation: string;
};
const melody = (pitches: number[], times?: number[], durations?: number[]): Score => ({
  events: pitches.flatMap((midi, i) =>
    midi ? [{ midi, beat: times?.[i] ?? i, duration: durations?.[i] ?? 0.8 }] : [],
  ),
  beats: 8,
  stepBeats: 1,
});
const combine = (...scores: Score[]): Score => ({
  events: scores.flatMap((s) => s.events),
  beats: Math.max(...scores.map((s) => s.beats)),
  stepBeats: 1,
});
const harmony = (chords: number[][]): Score => ({
  events: chords.flatMap((c, i) =>
    c.map((midi) => ({ midi, beat: i * 2, duration: 1.8, gain: 0.55 })),
  ),
  beats: 8,
  stepBeats: 1,
});
const upper = [72, 71, 69, 67, 65, 64, 62, 60];
const lower = [48, 50, 53, 52, 50, 48, 47, 48];
const bassLine = [48, 47, 45, 43, 41, 40, 38, 36];
const bassRef = melody(bassLine);
const voices = combine(melody(upper), melody(lower));
const phrase = [60, 62, 64, 67, 65, 64, 62, 60];
const rubatoTimes = [0, 0.8, 1.6, 2.8, 4, 4.7, 5.6, 7];
const rubatoDurations = [0.7, 0.7, 1.1, 1, 0.6, 0.8, 1.2, 0.8];
const pulse = melody([48, 55, 52, 55, 48, 55, 52, 55]);
const plane = [
  [60, 64, 68],
  [62, 66, 70],
  [64, 68, 72],
  [66, 70, 74],
];
export const styleExercises: Record<string, StyleExercise> = {
  ...expandedListeningExercises,
  ...pathListeningExercises,
  ...listeningExercises,
  'baroque-bass': {
    title: 'Сохраните движение баса',
    goal: 'Выберите вариант, где нисходящий бас остаётся неизменным, а верхний голос движется иначе.',
    action: 'Прослушайте бас, затем варианты. Выберите гармонизацию с тем же басом.',
    listen: 'Нижняя линия спускается на каждой доле.',
    hint: 'Следите за нижним рядом: до–си–ля–соль–фа–ми–ре–до.',
    reference: bassRef,
    options: [
      {
        label: 'Вариант A',
        score: combine(
          melody([48, 48, 48, 43, 41, 40, 38, 36]),
          melody([64, 65, 64, 62, 60, 59, 57, 55]),
        ),
      },
      { label: 'Вариант B', score: combine(bassRef, melody([64, 65, 64, 62, 60, 59, 57, 55])) },
      {
        label: 'Вариант C',
        score: combine(melody([...bassLine].reverse()), melody([64, 65, 64, 62, 60, 59, 57, 55])),
      },
    ],
    answer: 1,
    explanation:
      'Нисходящая линия баса сохранена; верхний голос меняет направление. Проверяем сохранение баса, не полный свод правил голосоведения.',
  },
  'bach-voices': {
    title: 'Поменяйте голоса местами',
    goal: 'Найдите вариант, где верхняя линия стала нижней, а нижняя — верхней. Контуры обеих линий должны сохраниться.',
    action: 'Послушайте исходные два голоса и три перестановки.',
    listen: 'Следите отдельно за каждой линией, а не за суммарным созвучием.',
    hint: 'Перенос на октаву меняет регистр, но не последовательность шагов.',
    reference: voices,
    options: [
      {
        label: 'Вариант A',
        score: combine(melody(upper.map((n) => n - 24)), melody(lower.map((n) => n + 24))),
      },
      {
        label: 'Вариант B',
        score: combine(
          melody([...upper].reverse().map((n) => n - 24)),
          melody(lower.map((n) => n + 24)),
        ),
      },
      { label: 'Вариант C', score: combine(melody(upper), melody(lower.map((n) => n + 12))) },
    ],
    answer: 0,
    explanation:
      'Обе мелодии сохранили интервалы и обменялись регистрами. Это вводная модель перестановки, не проверка всех правил двойного контрапункта.',
  },
  'classical-period': {
    title: 'Отложите завершение',
    goal: 'После вопроса выберите продолжение, которое сначала задерживает разрешение соль → до, а завершает его только на последней доле.',
    action: 'Сравните три окончания и выберите отсроченное завершение.',
    listen: 'Вопрос заканчивается на доминантовой гармонии.',
    hint: 'Смотрите нижнюю линию: соль должна сохраняться до последнего созвучия.',
    reference: harmony([
      [48, 60, 64, 67],
      [53, 60, 65, 69],
      [43, 59, 62, 67],
      [43, 59, 62, 67],
    ]),
    options: [
      {
        label: 'Вариант A',
        score: harmony([
          [48, 60, 64, 67],
          [48, 60, 64, 67],
          [43, 59, 62, 67],
          [48, 60, 64, 67],
        ]),
      },
      {
        label: 'Вариант B',
        score: harmony([
          [43, 59, 62, 67],
          [43, 59, 62, 67],
          [43, 59, 62, 67],
          [43, 59, 62, 67],
        ]),
      },
      {
        label: 'Вариант C',
        score: {
          events: [
            ...harmony([
              [43, 59, 62, 67],
              [43, 59, 62, 67],
              [43, 59, 62, 67],
            ]).events,
            ...[48, 60, 64, 67].map((midi) => ({ midi, beat: 7, duration: 0.8, gain: 0.55 })),
          ],
          beats: 8,
          stepBeats: 1,
        },
      },
    ],
    answer: 2,
    explanation:
      'Доминанта удерживает ожидание, тоника появляется только в конце. Это модель отсрочки каданса, а не полный восьмитактовый период.',
  },
  'mozart-shadow': {
    title: 'Контраст с общим ритмом',
    goal: 'Найдите нисходящий ответ с тем же ритмом, что и у восходящей темы.',
    action: 'Сравните направление нот и их расстояния по времени.',
    listen: 'Исходный жест: две короткие ноты, одна длинная, затем повтор.',
    hint: 'Ноты должны спускаться, но начинаться в те же моменты: 0, 1, 2, 4, 5, 6.',
    reference: melody([60, 62, 64, 65, 67, 69], [0, 1, 2, 4, 5, 6], [0.8, 0.8, 1.8, 0.8, 0.8, 1.8]),
    options: [
      { label: 'Вариант A', score: melody([72, 71, 69, 67, 65, 64], [0, 1, 2, 3, 4, 5]) },
      {
        label: 'Вариант B',
        score: melody([72, 71, 69, 67, 65, 64], [0, 1, 2, 4, 5, 6], [0.8, 0.8, 1.8, 0.8, 0.8, 1.8]),
      },
      {
        label: 'Вариант C',
        score: melody([60, 62, 64, 65, 67, 69], [0, 1, 2, 4, 5, 6], [0.8, 0.8, 1.8, 0.8, 0.8, 1.8]),
      },
    ],
    answer: 1,
    explanation:
      'Нисходящая мелодия даёт контраст, а общий ритмический жест связывает её с первой темой.',
  },
  'schubert-distance': {
    title: 'Из до мажора в ми-бемоль',
    goal: 'Сохраните мелодический звук соль и выберите среднее созвучие ми-бемоль мажора: ми♭–соль–си♭.',
    action: 'Послушайте смену гармонии под одной нотой.',
    listen: 'Один верхний звук остаётся общим для разных гармоний.',
    hint: 'В середине нужны ми♭ и си♭, а в начале и конце — до мажор.',
    reference: harmony([
      [48, 60, 64, 67],
      [48, 60, 64, 67],
      [48, 60, 64, 67],
      [48, 60, 64, 67],
    ]),
    options: [
      {
        label: 'Вариант A',
        score: harmony([
          [48, 60, 64, 67],
          [51, 63, 67, 70],
          [51, 63, 67, 70],
          [48, 60, 64, 67],
        ]),
      },
      {
        label: 'Вариант B',
        score: harmony([
          [48, 60, 64, 67],
          [43, 59, 62, 67],
          [43, 59, 62, 67],
          [48, 60, 64, 67],
        ]),
      },
      {
        label: 'Вариант C',
        score: harmony([
          [48, 60, 64, 67],
          [45, 60, 64, 69],
          [45, 60, 64, 69],
          [48, 60, 64, 67],
        ]),
      },
    ],
    answer: 0,
    explanation:
      'До мажор → ми-бемоль мажор → до мажор: общий звук соль связывает далёкие гармонии. Приём не принадлежит исключительно Шуберту.',
  },
  'chopin-rubato': {
    title: 'Свободная мелодия, ровный бас',
    goal: 'Выберите вариант, где мелодия ускоряется и задерживается, а восемь басовых ударов остаются ровными.',
    action: 'Слушайте бас и верхнюю линию отдельно. На схеме время идёт слева направо.',
    listen: 'В образце оба голоса идут ровно.',
    hint: 'У нижних нот должны остаться равные интервалы по времени; у верхних — разные.',
    reference: combine(melody(phrase), pulse),
    options: [
      {
        label: 'Вариант A',
        score: combine(
          melody(phrase, rubatoTimes, rubatoDurations),
          melody([48, 55, 52, 55, 48, 55, 52, 55], rubatoTimes, rubatoDurations),
        ),
      },
      { label: 'Вариант B', score: combine(melody(phrase), pulse) },
      { label: 'Вариант C', score: combine(melody(phrase, rubatoTimes, rubatoDurations), pulse) },
    ],
    answer: 2,
    explanation:
      'Рубато меняет моменты начала мелодических нот, но не басовый пульс. Это одна учебная модель рубато, не универсальное правило исполнения Шопена.',
  },
  'debussy-color': {
    title: 'Созвучие движется целиком',
    goal: 'Найдите вариант, где увеличенное трезвучие переносится вверх целыми тонами без изменения внутреннего строения.',
    action: 'Сравните три гармонических маршрута.',
    listen: 'Исходное созвучие: до–ми–соль♯. Между соседними звуками по четыре полутона.',
    hint: 'Каждый следующий аккорд должен быть на два полутона выше предыдущего.',
    reference: harmony(Array.from({ length: 4 }, () => plane[0])),
    options: [
      {
        label: 'Вариант A',
        score: harmony([
          [60, 64, 67],
          [62, 65, 69],
          [64, 67, 71],
          [65, 69, 72],
        ]),
      },
      { label: 'Вариант B', score: harmony(plane) },
      { label: 'Вариант C', score: harmony([plane[0], plane[0], plane[0], plane[0]]) },
    ],
    answer: 1,
    explanation:
      'Все три голоса движутся параллельно целыми тонами. Внутри созвучий сохраняются большие терции — модель гармонической краски, не цитата Дебюсси.',
  },
  'webern-space': {
    title: 'Пауза становится частью фразы',
    goal: 'Выберите четыре коротких звука с паузами между ними и чередованием низкого и высокого регистра.',
    action: 'Сравните плотность и высоту событий на звуковой карте.',
    listen: 'Исходные четыре звука идут подряд в среднем регистре.',
    hint: 'Правильная карта имеет пустые промежутки и прыжки вверх-вниз.',
    reference: melody([60, 61, 66, 67], [0, 1, 2, 3], [0.35, 0.35, 0.35, 0.35]),
    options: [
      {
        label: 'Вариант A',
        score: melody([48, 73, 54, 79], [0, 2, 4, 6], [0.35, 0.35, 0.35, 0.35]),
      },
      {
        label: 'Вариант B',
        score: melody([60, 61, 66, 67], [0, 2, 4, 6], [0.35, 0.35, 0.35, 0.35]),
      },
      {
        label: 'Вариант C',
        score: melody([48, 73, 54, 79], [0, 0.4, 0.8, 1.2], [0.35, 0.35, 0.35, 0.35]),
      },
    ],
    answer: 0,
    explanation:
      'Короткие события разделены тишиной и разнесены по регистрам. Это модель разреженной фактуры, не упражнение на двенадцатитоновый ряд.',
  },
};
export function checkStyle(id: string, choice: number, heard: number[]) {
  const exercise = styleExercises[id];
  if (choice < 0) return { ok: false, text: 'Выберите вариант после прослушивания.' };
  if (![0, 1, 2].every((i) => heard.includes(i)))
    return { ok: false, text: 'Дослушайте все три варианта: сравнение — часть упражнения.' };
  return {
    ok: choice === exercise.answer,
    text:
      choice === exercise.answer
        ? exercise.explanation
        : `Пока не совпадает с условием. ${exercise.hint}`,
  };
}
export function eventLabel(event: NoteEvent) {
  const names = ['до', 'до♯', 'ре', 'ми♭', 'ми', 'фа', 'фа♯', 'соль', 'соль♯', 'ля', 'си♭', 'си'];
  return `${names[event.midi % 12]} · доля ${event.beat + 1}`;
}
