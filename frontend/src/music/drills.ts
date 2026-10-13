export type DrillKind = 'notes' | 'intervals' | 'chords' | 'memory';
export const intervalNames = [
  'Прима',
  'Малая секунда',
  'Большая секунда',
  'Малая терция',
  'Большая терция',
  'Кварта',
  'Тритон',
  'Квинта',
  'Малая секста',
  'Большая секста',
  'Малая септима',
  'Большая септима',
  'Октава',
];
export const drillNames = {
  notes: 'Ноты',
  intervals: 'Интервалы',
  chords: 'Аккорды',
  memory: 'Найди изменение',
};
export type DrillQuestion = {
  pitches: number[];
  answer: string;
  choices: string[];
  explanation: string;
};
const notes = [60, 62, 64, 65, 67, 69, 71, 72];
const names = ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си', 'До'];
export function makeQuestion(kind: DrillKind, index: number, random = Math.random): DrillQuestion {
  const pick = (n: number) => Math.min(n - 1, Math.floor(random() * n));
  if (kind === 'memory') {
    const root = 60 + pick(5);
    const motif = [root, root + 2, root + 4, root + 2];
    const slot = pick(4);
    const changed = [...motif];
    changed[slot] += 2;
    return {
      pitches: [...motif, ...changed],
      answer: String(slot + 1),
      choices: ['1', '2', '3', '4'],
      explanation: `Во второй фразе нота ${slot + 1} стала на тон выше. Остальные три ноты не изменились.`,
    };
  }
  if (kind === 'notes') {
    const i = pick(notes.length);
    return {
      pitches: [notes[i]],
      answer: names[i],
      choices: names.slice(0, 7),
      explanation: `Это ${names[i].toLowerCase()}. Посмотрите на положение ноты на стане.`,
    };
  }
  if (kind === 'intervals') {
    const pool = [2, 3, 4, 5, 7, 12];
    const distance = pool[pick(pool.length)];
    const root = 60 + pick(5);
    return {
      pitches: [root, root + distance],
      answer: intervalNames[distance],
      choices: pool.map((i) => intervalNames[i]),
      explanation: `Между звуками ${distance} полутонов: ${intervalNames[distance].toLowerCase()}.`,
    };
  }
  const major = pick(2) === 0;
  const root = 60 + pick(5);
  return {
    pitches: [root, root + (major ? 4 : 3), root + 7],
    answer: major ? 'Мажорное' : 'Минорное',
    choices: ['Мажорное', 'Минорное'],
    explanation: major
      ? 'Мажорное трезвучие: большая терция и затем малая.'
      : 'Минорное трезвучие: малая терция и затем большая.',
  };
}
