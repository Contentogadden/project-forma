import catalog from '../../../src/main/resources/catalog/expanded-composers.json' with { type: 'json' };
import type { CompositionExercise } from './compositionExercises.ts';
import type { Score } from './model.ts';
import type { StyleExercise } from './styleExercises.ts';

export const expandedCatalog = catalog;
const keys = Array.from({ length: 13 }, (_, i) => 60 + i);
const name = (midi: number) =>
  ['до', 'до♯', 'ре', 'ми♭', 'ми', 'фа', 'фа♯', 'соль', 'соль♯', 'ля', 'си♭', 'си'][midi % 12] +
  (midi === 72 ? ' ↑' : '');
const line = (notes: number[], times = notes.map((_, i) => i), duration = 0.6): Score => ({
  events: notes.map((midi, i) => ({ midi, beat: times[i], duration })),
  beats: 8,
  stepBeats: 1,
});
const together = (...scores: Score[]): Score => ({
  events: scores.flatMap((s) => s.events),
  beats: 8,
  stepBeats: 1,
});
const altered = (score: Score): Score => ({
  ...score,
  events: score.events.map((event, i) =>
    i === 0 ? { ...event, midi: event.midi + 1 } : { ...event },
  ),
});
const repeat = (notes: number[]) => [...notes.slice(0, 4), ...notes.slice(0, 4)];
const withGains = (notes: number[], positions: number[]) => ({
  ...line(notes),
  events: line(notes).events.map((e, i) => ({ ...e, gain: positions.includes(i) ? 1 : 0.3 })),
});

export function listeningModel(composer: (typeof catalog.composers)[number], index: number) {
  const notes = composer.practice.notes;
  const head = notes.slice(0, 4);
  const kind = composer.listening.kind;
  let reference: Score = line(notes);
  let correct: Score = reference;
  let wrong: Score[] = [];
  let goal = '';
  let hint = '';
  let explanation = '';
  let aspect = 'Мелодия';
  switch (kind) {
    case 'pedal': {
      const bass = notes[0] - 12;
      correct = together(reference, {
        events: [{ midi: bass, beat: 0, duration: 7.8, gain: 0.45 }],
        beats: 8,
        stepBeats: 1,
      });
      wrong = [
        together(reference, line(Array(8).fill(bass))),
        together(reference, line(notes.map((n) => n - 12))),
      ];
      goal = `Найдите исходную линию над одним выдержанным низким ${name(bass)}. Бас не повторяется и не меняется.`;
      hint = 'На нижней линии должна быть одна длинная нота, а не восемь отдельных атак.';
      explanation = 'Мелодия сохранена над одним выдержанным педальным тоном.';
      aspect = 'Гармония';
      break;
    }
    case 'octave':
      correct = together(reference, line(notes.map((n) => n - 12)));
      wrong = [
        together(reference, line(notes.map((n) => n - 7))),
        together(
          reference,
          line(
            notes.map((n) => n - 12),
            notes.map((_, i) => i + 0.25),
          ),
        ),
      ];
      goal = 'Найдите исходную линию с одновременным удвоением каждого звука на октаву ниже.';
      hint = 'Оба голоса вступают вместе; между ними всегда 12 полутонов.';
      explanation = 'Нижний голос точно повторяет верхний на октаву ниже, без временного сдвига.';
      aspect = 'Тембр';
      break;
    case 'imitation':
      reference = line(head);
      correct = line([...head, ...head.map((n) => n + 7)]);
      wrong = [
        line([...head, ...head.map((n) => n + 5)]),
        line([...head, ...[...head].reverse().map((n) => n + 7)]),
      ];
      goal =
        'Найдите четыре исходные ноты, за которыми следует точный ответ на семь полутонов выше с тем же ритмом.';
      hint = 'Вторая половина — первая, перенесённая на чистую квинту. Порядок нот сохраняется.';
      explanation = 'Ответ сохраняет интервалы, порядок и ритм темы, начиная на квинту выше.';
      break;
    case 'inversion': {
      reference = line(head);
      const inverted = head.map((n) => 72 - (n - head[0]));
      correct = line([...head, ...inverted]);
      wrong = [line([...head, ...inverted.map((n) => n - 1)]), line([...head, ...head])];
      goal =
        'Найдите ответ от верхнего до, в котором направление каждого интервала исходных четырёх нот обращено.';
      hint = 'Начало ответа — до ↑; восходящий шаг становится таким же нисходящим и наоборот.';
      explanation =
        'От до ↑ сохранены величины интервалов, но изменены их направления. Это не ракоход.';
      break;
    }
    case 'diminution':
      correct = line(
        notes,
        notes.map((_, i) => i / 2),
        0.3,
      );
      wrong = [line(notes, undefined, 0.3), altered(correct)];
      goal =
        'Найдите те же восемь высот с вдвое меньшими промежутками между вступлениями и вдвое меньшими длительностями.';
      hint = 'Начала нот: 0, ½, 1, 1½…; каждая длится 0,3 доли.';
      explanation = 'Все высоты сохранены; время вступления и длительности уменьшены вдвое.';
      aspect = 'Ритм';
      break;
    case 'augmentation':
      reference = line(head);
      correct = line(head, [0, 2, 4, 6], 1.2);
      wrong = [line(head, [0, 2, 4, 6], 0.6), altered(correct)];
      goal =
        'Найдите четыре исходные высоты с вдвое большими промежутками между вступлениями и длительностями.';
      hint = 'Начала: 0, 2, 4, 6; каждая нота длится 1,2 доли вместо 0,6.';
      explanation = 'Высоты и порядок сохранены, обе временные величины увеличены вдвое.';
      aspect = 'Ритм';
      break;
    case 'accent': {
      const positions =
        composer.id === 'bartok' ? [0, 3, 5] : composer.id === 'boccherini' ? [0, 3, 6] : [1, 5];
      reference = withGains(notes, []);
      correct = withGains(notes, positions);
      wrong = [
        withGains(
          notes,
          positions.map((p) => (p + 1) % 8),
        ),
        withGains(notes, []),
      ];
      goal = `Найдите ровные восемь нот с акцентами только на местах ${positions.map((p) => p + 1).join(', ')}.`;
      hint = 'Меняется только громкость: высоты и моменты вступления остаются прежними.';
      explanation = 'Акценты стоят на указанных местах; пульс и мелодия не изменились.';
      aspect = 'Ритм';
      break;
    }
    case 'return': {
      reference = line(notes.slice(0, 3));
      const target = [...notes.slice(0, 3), notes[3], notes[4], ...notes.slice(0, 3)];
      correct = line(target);
      wrong = [
        line([...target.slice(0, 5), ...target.slice(5).map((n) => n + 1)]),
        line([...target.slice(0, 5), ...target.slice(5).reverse()]),
      ];
      if (JSON.stringify(wrong[1].events) === JSON.stringify(correct.events))
        wrong[1] = line([...target.slice(0, 5), ...target.slice(5).map((n) => n + 2)]);
      goal =
        'Найдите вариант, в котором три ноты начала точно возвращаются на местах 6–8 после двух промежуточных звуков.';
      hint = 'Сравните высоты и порядок первых и последних трёх нот.';
      explanation = 'Начальный трёхзвуковый жест вернулся без изменения высот и порядка.';
      aspect = 'Форма';
      break;
    }
    case 'chord':
      reference = {
        events: head
          .filter((n, i, a) => a.indexOf(n) === i)
          .map((midi) => ({ midi, beat: 0, duration: 3.6, gain: 0.45 })),
        beats: 8,
        stepBeats: 1,
      };
      correct = line(notes);
      wrong = [altered(correct), line([...notes].reverse())];
      if (JSON.stringify(wrong[1].events) === JSON.stringify(correct.events))
        wrong[1] = line([...notes.slice(1), notes[0]]);
      goal = `Найдите ровную линию ${notes.map(name).join('–')}, которая раскрывает звуки исходного созвучия в заданном порядке.`;
      hint =
        'Одинаковый состав нот ещё не означает одинаковый порядок. Сверьте восхождение и возвращение.';
      explanation = 'Созвучие раскрыто в отдельные ноты с сохранением заданного порядка.';
      aspect = 'Гармония';
      break;
    case 'syncopation':
      reference = line(head, [0, 2, 4, 6], 0.4);
      correct = line(head, [0.5, 2.5, 4.5, 6.5], 0.4);
      wrong = [reference, altered(correct)];
      goal =
        'Найдите те же четыре высоты, сдвинутые на половину доли позже, при неизменной длительности каждой ноты.';
      hint = 'Новые начала: ½, 2½, 4½, 6½; длительность по-прежнему 0,4 доли.';
      explanation = 'Высоты и длительности сохранены, все вступления сдвинуты на половину доли.';
      aspect = 'Ритм';
      break;
    case 'staccato':
      reference = line(notes, undefined, 0.9);
      correct = line(notes, undefined, 0.2);
      wrong = [
        altered(correct),
        line(
          notes,
          notes.map((_, i) => i / 2),
          0.2,
        ),
      ];
      goal =
        'Найдите те же восемь высот на тех же долях, но короткими нотами по 0,2 доли вместо 0,9.';
      hint = 'Укорачиваются звуки, а не промежутки между их началами.';
      explanation =
        'Порядок и моменты вступления сохранены; между короткими звуками появились большие паузы.';
      aspect = 'Ритм';
      break;
    case 'ostinato':
      reference = line(head);
      correct = line(repeat(notes));
      wrong = [line([...head, ...[...head].reverse()]), line([...head, ...head.map((n) => n + 1)])];
      goal = 'Найдите вариант с двумя точными повторениями исходной четырёхзвуковой ячейки.';
      hint = 'Во второй половине не меняются высоты, порядок и ровный пульс.';
      explanation = 'Четырёхзвуковая ячейка повторена без изменения.';
      aspect = 'Форма';
      break;
    default:
      throw new Error(`Unknown listening model: ${kind}`);
  }
  const answer = index % 3;
  const variants = [...wrong];
  variants.splice(answer, 0, correct);
  const exercise: StyleExercise = {
    title: composer.listening.title,
    goal,
    hint,
    reference,
    options: variants.map((score, i) => ({ label: `Вариант ${'ABC'[i]}`, score })),
    answer,
    explanation,
    action: 'Дослушайте три варианта, выберите ответ и проверьте себя.',
    listen: 'Слушайте заданную модель и следите за высотой и временем на звуковой карте.',
  };
  return { exercise, aspect };
}

export const expandedCompositionExercises: Record<string, CompositionExercise> = Object.fromEntries(
  catalog.composers.map((c) => {
    const p = c.practice;
    const initial = p.notes.map((n, i) => (p.editable.includes(i) ? 0 : n));
    return [
      p.id,
      {
        title: p.title,
        goal: p.goal,
        hint: p.hint,
        initial,
        example: [...initial],
        editable: [...p.editable],
        keys: [...keys],
        action: `Выберите место ${p.editable.map((i) => i + 1).join(', ')}, затем нажмите клавишу.`,
        listen:
          'Послушайте заданные ноты. Тишина на свободных местах оставляет время для вашего продолжения.',
        method:
          'Оригинальная учебная модель Forma: один конкретный приём, слуховое сравнение и проверка высот. Не цитата и не оценка подлинности авторского стиля.',
        accept: (notes: number[]) => p.editable.every((i) => notes[i] === p.notes[i]),
        success: `Условие выполнено: ${p.notes.map(name).join('–')}. Послушайте собранную линию.`,
      },
    ];
  }),
);
export const expandedListeningExercises: Record<string, StyleExercise> = Object.fromEntries(
  catalog.composers.map((c, i) => [c.listening.id, listeningModel(c, i).exercise]),
);
