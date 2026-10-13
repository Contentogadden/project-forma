import { checkComposition, compositionExercises } from './compositionExercises.ts';
import { checkStyle, styleExercises } from './styleExercises.ts';

export type Tone = 'soft' | 'reed' | 'bell';
export type MusicState = {
  version: 1;
  tempo: number;
  notes: number[];
  chords: string[];
  hits: number[];
  order: string[];
  tone: Tone;
  registerChoice: number;
  heard: number[];
};
export type NoteEvent = {
  beat: number;
  duration: number;
  midi: number;
  gain?: number;
  tone?: Tone;
};
export type Score = { events: NoteEvent[]; beats: number; stepBeats: number };
export const interactiveIds = [
  'melody-question',
  'harmony-home',
  'rhythm-shift',
  'form-return',
  'timbre-register',
  'stravinsky-accent',
  'brahms-meter',
  'beethoven-motive',
  ...Object.keys(styleExercises),
  ...Object.keys(compositionExercises),
];
export const isRhythm = (id: string) =>
  ['rhythm-shift', 'stravinsky-accent', 'brahms-meter'].includes(id);
export const isMelody = (id: string) =>
  ['melody-question', 'beethoven-motive'].includes(id) || !!compositionExercises[id];
export const question = [60, 62, 64, 67, 64, 62, 64, 62];
export const theme = [60, 62, 64, 67, 64, 62, 60, 60];
export const contrast = [67, 65, 64, 62, 65, 64, 62, 62];
export const phrase = [60, 64, 67, 64, 62, 65, 64, 60];
export const chordNotes: Record<string, number[]> = {
  C: [48, 55, 60, 64],
  F: [41, 57, 60, 65],
  G: [43, 55, 59, 62],
  Am: [45, 57, 60, 64],
  Dm: [38, 57, 62, 65],
};
export const givenBass = [48, 41, 43, 48];
export const bassScore: Score = {
  events: givenBass.map((midi, i) => ({ midi, beat: i * 4, duration: 3.7 })),
  beats: 16,
  stepBeats: 4,
};
export function compareScores(reference: Score, answer: Score): Score {
  const offset = reference.beats + 2;
  return {
    events: [...reference.events, ...answer.events.map((n) => ({ ...n, beat: n.beat + offset }))],
    beats: offset + answer.beats,
    stepBeats: 1,
  };
}
export const noteNames: Record<number, string> = {
  0: '—',
  60: 'До',
  61: 'До♯',
  62: 'Ре',
  63: 'Ми♭',
  64: 'Ми',
  65: 'Фа',
  66: 'Фа♯',
  67: 'Соль',
  68: 'Соль♯',
  69: 'Ля',
  70: 'Си♭',
  71: 'Си',
  72: 'До ↑',
};
export const registerNames = ['Низкий', 'Средний', 'Высокий'];
export function initialState(id = 'melody-question'): MusicState {
  let notes = [60, 62, 64, 67, 64, 62, 0, 0];
  if (id === 'beethoven-motive') notes = [60, 62, 64, 0, 0, 0, 0, 0];
  const composition = compositionExercises[id];
  if (composition) notes = [...composition.initial];
  return {
    version: 1,
    tempo: 90,
    notes,
    chords: ['C', 'F', 'C', 'G'],
    hits: Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 2 : 1)),
    order: ['A', 'A', 'B'],
    tone: 'soft',
    registerChoice: -1,
    heard: [],
  };
}
function line(notes: number[], offset = 0, transpose = 0): NoteEvent[] {
  return notes.flatMap((midi, i) =>
    midi ? [{ beat: offset + i, duration: 0.85, midi: midi + transpose }] : [],
  );
}
export function scoreFor(
  id: string,
  state: MusicState,
  reference = false,
  register = 1,
  block?: string,
): Score {
  if (compositionExercises[id])
    return {
      events: line(reference ? compositionExercises[id].example : state.notes),
      beats: 8,
      stepBeats: 1,
    };
  if (styleExercises[id])
    return reference
      ? styleExercises[id].reference
      : styleExercises[id].options[state.registerChoice < 0 ? 0 : state.registerChoice].score;
  if (id === 'beethoven-motive')
    return {
      events: line(reference ? [60, 62, 64, 0, 60, 62, 64, 0] : state.notes),
      beats: 8,
      stepBeats: 1,
    };
  if (id === 'melody-question')
    return { events: line(reference ? question : state.notes), beats: 8, stepBeats: 1 };
  if (id === 'harmony-home') {
    const chords = reference ? ['C', 'F', 'G', 'C'] : state.chords;
    return {
      events: chords.flatMap((c, i) =>
        [givenBass[i], ...chordNotes[c].slice(1)].map((midi) => ({
          beat: i * 4,
          duration: 3.7,
          midi,
          gain: 0.65,
        })),
      ),
      beats: 16,
      stepBeats: 4,
    };
  }
  if (isRhythm(id)) {
    const quarter = id === 'brahms-meter';
    const count = quarter ? 12 : 16;
    const stepBeats = quarter ? 1 : 0.5;
    const hits = reference
      ? Array.from({ length: count }, (_, i) => (i % (quarter ? 3 : 4) === 0 ? 2 : 1))
      : state.hits.slice(0, count);
    return {
      events: hits.flatMap((hit, i) =>
        hit ? [{ beat: i * stepBeats, duration: 0.24, midi: 60, gain: hit === 2 ? 1 : 0.3 }] : [],
      ),
      beats: count * stepBeats,
      stepBeats,
    };
  }
  if (id === 'form-return') {
    let order = state.order;
    if (reference) order = ['A', 'B', 'A′'];
    if (block) order = [block];
    return {
      events: order.flatMap((b, i) =>
        line(b === 'B' ? contrast : theme, i * 8, b === 'A′' ? 12 : 0),
      ),
      beats: order.length * 8,
      stepBeats: 8,
    };
  }
  return { events: line(phrase, 0, (register - 1) * 12), beats: 8, stepBeats: 1 };
}
export function feedback(id: string, state: MusicState): { ok: boolean; text: string } {
  if (compositionExercises[id]) return checkComposition(id, state.notes);
  if (styleExercises[id]) return checkStyle(id, state.registerChoice, state.heard);
  if (id === 'beethoven-motive') {
    const n = state.notes;
    const ok = n[4] > 0 && n[4] !== n[0] && n[5] - n[4] === 2 && n[6] - n[5] === 2;
    return {
      ok,
      text: ok
        ? 'Два восходящих тона сохранены, мотив перенесён на новую высоту. Сравните два проведения на слух.'
        : 'Во втором мотиве нужны три ноты и два восходящих целых тона, как в до–ре–ми. Начните с другой ноты; например, с ре.',
    };
  }
  if (id === 'stravinsky-accent' || id === 'brahms-meter') {
    const accentPositions = id === 'stravinsky-accent' ? [0, 3, 6, 8, 10, 13] : [0, 2, 4, 6, 8, 10];
    const count = id === 'brahms-meter' ? 12 : 16;
    const ok = state.hits
      .slice(0, count)
      .every((h, i) => h === (accentPositions.includes(i) ? 2 : 1));
    return {
      ok,
      text: ok
        ? 'Группировка собрана. Прослушайте её вместе с метрономом, затем сравните с исходным размером.'
        : id === 'stravinsky-accent'
          ? 'Сохраните все удары и выделите начала групп: 3+3+2 в первом такте, 2+3+3 во втором.'
          : 'Сохраните двенадцать четвертей и выделите каждую нечётную по порядку: 1, 3, 5, 7, 9, 11. Группы по два будут пересекать тактовые черты 3/4.',
    };
  }
  if (id === 'melody-question') {
    if (state.notes.some((n) => n === 0))
      return {
        ok: false,
        text: 'В ответе ещё есть паузы. Заполните восемь долей, затем послушайте окончание.',
      };
    if (state.notes[7] !== 60)
      return {
        ok: false,
        text: 'Ответ заканчивается не на до. Попробуйте до в восьмой доле и сравните устойчивость.',
      };
    return {
      ok: true,
      text: 'Все доли заполнены, ответ заканчивается на до. Сравните его с открытым окончанием вопроса на ре.',
    };
  }
  if (id === 'harmony-home') {
    const target = ['C', 'F', 'G', 'C'];
    const wrong = state.chords.findIndex((c, i) => c !== target[i]);
    return {
      ok: wrong < 0,
      text:
        wrong < 0
          ? 'Бас и основные трезвучия согласованы: I–IV–V–I. Сравните звучание одной басовой линии и полной гармонизации.'
          : `Проверьте такт ${wrong + 1}: в басу ${['до', 'фа', 'соль', 'до'][wrong]}. В этом задании без обращений нужна та же основная нота у трезвучия. Нажмите аккорд и послушайте сочетание.`,
    };
  }
  if (id === 'rhythm-shift') {
    const ok = state.hits.every((h, i) => h === (i % 4 === 3 ? 2 : 1));
    return {
      ok,
      text: ok
        ? 'Длительности сохранены, акценты стоят на «и» после 2 и 4. Сравните с исходным ритмом под метроном.'
        : 'Оставьте все шестнадцать ударов. Сделайте акцент только на «и» после 2 и 4 в каждом такте; остальные удары — обычные.',
    };
  }
  if (id === 'form-return') {
    const ok = state.order.join(',') === 'A,B,A′';
    return {
      ok,
      text: ok
        ? 'Форма A–B–A′ собрана: тема, контраст, возвращение октавой выше. Прослушайте стыки частей.'
        : 'Начните с A, поставьте контрастную B в середину и верните A′ в конце. Можно сначала прослушать каждый блок отдельно.',
    };
  }
  const ok = [0, 1, 2].every((r) => state.heard.includes(r)) && state.registerChoice >= 0;
  return {
    ok,
    text: ok
      ? 'Три регистра прослушаны, ваш выбор сохранён в работе. У этого задания нет единственного верного регистра.'
      : 'Прослушайте до конца все три регистра одним тембром, затем выберите свой вариант спокойного окончания.',
  };
}
