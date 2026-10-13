import type { Assignment } from '../AssignmentSheet';
import { normalizeCatalogQuery } from './catalog.ts';
import { composerPaths } from './composerPaths.ts';
import { expandedCatalog } from './expandedPractice.ts';
import { interactiveIds } from './model.ts';
import { styleExercises } from './styleExercises.ts';

export type Domain = {
  id: string;
  title: string;
  group: string;
  caption: string;
  topics: string[];
  related: string[];
};
export const knowledgeGroups = [
  { id: 'language', title: 'Музыкальный язык', caption: 'Слышать и читать' },
  { id: 'composition', title: 'Устройство музыки', caption: 'Связывать и развивать' },
  { id: 'context', title: 'Контекст и интерпретация', caption: 'Сравнивать и понимать' },
  { id: 'research', title: 'Исследование и передача', caption: 'Доказывать и объяснять' },
];
export const domains: Domain[] = [
  {
    id: 'grammar',
    title: 'Грамматика',
    group: 'language',
    caption: 'Ноты · интервалы · лад',
    related: ['ear', 'harmony'],
    topics: [
      'Нотация и энгармония',
      'Интервалы и обращения',
      'Лады и звукоряды',
      'Тональность и ступени',
      'Строение аккордов',
      'Мелодическая линия',
      'Мелодическое украшение',
    ],
  },
  {
    id: 'ear',
    title: 'Слух',
    group: 'language',
    caption: 'Услышать · запомнить · записать',
    related: ['grammar', 'rhythm'],
    topics: [
      'Интонация и внутренний слух',
      'Мелодический диктант',
      'Многоголосный диктант',
      'Гармонический диктант',
      'Слуховое сравнение',
      'Модуляционный слух',
      'Чтение с листа',
      'Посттональный слух',
    ],
  },
  {
    id: 'rhythm',
    title: 'Ритм и время',
    group: 'language',
    caption: 'Пульс · метр · движение',
    related: ['ear', 'form'],
    topics: [
      'Пульс и метрическая иерархия',
      'Синкопа и смещение',
      'Гемиола',
      'Полиритмия и полиметрия',
      'Аддитивный ритм',
      'Увеличение и уменьшение',
      'Метрическая модуляция',
      'Rubato и исполнение',
    ],
  },
  {
    id: 'harmony',
    title: 'Гармония',
    group: 'composition',
    caption: 'Функции · голоса · тональный план',
    related: ['grammar', 'polyphony', 'form'],
    topics: [
      'Функциональные обороты',
      'Голосоведение',
      'Аккорды и расположение',
      'Каденции',
      'Неаккордовые звуки',
      'Органный пункт',
      'Секвенции',
      'Отклонения и модуляции',
      'Альтерация и хроматика',
      'Гармонизация мелодии и баса',
    ],
  },
  {
    id: 'polyphony',
    title: 'Полифония',
    group: 'composition',
    caption: 'Независимые голоса',
    related: ['harmony', 'form'],
    topics: [
      'Самостоятельность голосов',
      'Консонанс и диссонанс',
      'Строгое письмо',
      'Обратимый контрапункт',
      'Имитация и канон',
      'Фуга и тональный ответ',
      'Стретта и многотемная фуга',
      'Преобразование мотива',
    ],
  },
  {
    id: 'form',
    title: 'Форма',
    group: 'composition',
    caption: 'Мотив · раздел · целое',
    related: ['harmony', 'analysis'],
    topics: [
      'Мотив и тематическое развитие',
      'Фраза, предложение и период',
      'Каденция и границы',
      'Двух- и трёхчастные формы',
      'Вариации',
      'Рондо',
      'Сонатная форма',
      'Цикл и сквозное развитие',
      'Вокальные и индивидуальные формы',
    ],
  },
  {
    id: 'modern',
    title: 'Новые звуковые системы',
    group: 'composition',
    caption: 'За пределами обычной тональности',
    related: ['grammar', 'analysis'],
    topics: [
      'Расширенная тональность и модальность',
      'Симметричные звукоряды',
      'Полиаккорды и кластеры',
      'Атональность и центричность',
      'Двенадцатитоновая техника',
      'Серийная организация',
      'Классы высот и множества',
      'Сонорика и спектральные подходы',
      'Алеаторика и минимализм',
      'Микротональность и электроакустика',
    ],
  },
  {
    id: 'texture',
    title: 'Фактура и тембр',
    group: 'context',
    caption: 'Регистр · инструмент · пространство',
    related: ['polyphony', 'form'],
    topics: [
      'Музыкальный склад и фактура',
      'Регистры и удвоения',
      'Инструментоведение',
      'Баланс и оркестровые функции',
      'Чтение партитур',
      'Инструментальная идиоматика',
      'Оркестровка и переложение',
      'Расширенные техники',
    ],
  },
  {
    id: 'history',
    title: 'Исторические языки',
    group: 'context',
    caption: 'Эпохи без жёстких границ',
    related: ['theories', 'analysis'],
    topics: [
      'Средневековая модальность и нотация',
      'Ренессансная полифония',
      'Барокко и генерал-бас',
      'Классическая композиционная логика',
      'Романтическая хроматика и форма',
      'Направления XX–XXI веков',
      'Национальные и устные традиции',
      'Историческое исполнение',
      'Жанр и индивидуальный стиль',
    ],
  },
  {
    id: 'analysis',
    title: 'Методы анализа',
    group: 'context',
    caption: 'Наблюдение · трактовка · аргумент',
    related: ['form', 'research'],
    topics: [
      'Гармонический и ладовый анализ',
      'Мотивно-тематический анализ',
      'Формальные функции',
      'Контрапунктический анализ',
      'Шенкеровский подход',
      'Посттональный анализ',
      'Трансформационные подходы',
      'Ритмический и тембровый анализ',
      'Семантика, топосы и риторика',
      'Сопоставление интерпретаций',
    ],
  },
  {
    id: 'theories',
    title: 'История теории',
    group: 'context',
    caption: 'Понятия и школы',
    related: ['history', 'research'],
    topics: [
      'Исторические трактаты',
      'История лада и тональности',
      'Генерал-бас и фундаментальный бас',
      'Теории гармонии и контрапункта',
      'Теории формы',
      'Российские и советские школы',
      'Зарубежные теоретические школы',
      'Терминология и перевод',
    ],
  },
  {
    id: 'research',
    title: 'Исследование',
    group: 'research',
    caption: 'От вопроса к доказательству',
    related: ['analysis', 'digital'],
    topics: [
      'Исследовательский вопрос',
      'Обзор литературы',
      'Корпус и метод',
      'Источниковедение и текстология',
      'Библиография и цитирование',
      'Аргументация и контрпримеры',
      'Научный текст и доклад',
      'Иностранные языки',
      'Защита и исследовательская этика',
    ],
  },
  {
    id: 'teaching',
    title: 'Педагогика',
    group: 'research',
    caption: 'Навык · задание · обратная связь',
    related: ['ear', 'research'],
    topics: [
      'Диагностика уровня',
      'Предпосылки и последовательность',
      'Учебная цель',
      'Подбор музыкального материала',
      'Ошибки и допустимые решения',
      'Подсказки и перенос навыка',
      'Критерии оценивания',
      'Конструирование заданий',
    ],
  },
  {
    id: 'digital',
    title: 'Цифровые инструменты',
    group: 'research',
    caption: 'Нотный текст и музыкальные данные',
    related: ['research', 'texture'],
    topics: [
      'Нотный редактор',
      'MIDI и MusicXML',
      'Аудио и спектрограмма',
      'Корпусный анализ',
      'Статистика и воспроизводимость',
      'Программирование для исследования',
      'Проверка транскрипции и ИИ',
      'Источники и лицензии',
    ],
  },
];
export type TaskPlacement = { domain: string; topic: number; family: string; label: string };
const p = (domain: string, topic: number, family: string, label: string): TaskPlacement => ({
  domain,
  topic,
  family,
  label,
});
const explicit: Record<string, TaskPlacement> = {
  'melody-question': p('grammar', 5, 'ending', 'Завершение мелодии'),
  'harmony-home': p('harmony', 9, 'harmonization', 'Гармонизация баса'),
  'rhythm-shift': p('rhythm', 1, 'accents', 'Акцент и смещение'),
  'form-return': p('form', 3, 'return', 'Возвращение темы'),
  'timbre-register': p('texture', 1, 'register', 'Сравнение регистров'),
  'stravinsky-accent': p('rhythm', 4, 'grouping', 'Неравномерная группировка'),
  'brahms-meter': p('rhythm', 2, 'hemiola', 'Группы поверх метра'),
  'beethoven-motive': p('polyphony', 7, 'transpose', 'Перенос мотива'),
  'bach-answer': p('polyphony', 4, 'imitation', 'Точный имитационный ответ'),
  'bach-step-sequence': p('harmony', 6, 'diatonic-sequence', 'Диатоническая секвенция'),
  'vivaldi-down-sequence': p('harmony', 6, 'diatonic-sequence', 'Диатоническая секвенция'),
  'haydn-close': p('grammar', 5, 'ending', 'Завершение мелодии'),
  'haydn-tonic-arch': p('harmony', 2, 'arpeggio', 'Разложение созвучия'),
  'mozart-turn': p('grammar', 6, 'neighbor', 'Опевание'),
  'mozart-passing': p('harmony', 4, 'passing', 'Проходящие звуки'),
  'beethoven-inversion': p('polyphony', 7, 'inversion', 'Обращение интервалов'),
  'webern-mirror-cell': p('polyphony', 7, 'inversion', 'Обращение интервалов'),
  'webern-retrograde': p('polyphony', 7, 'retrograde', 'Ракоход'),
  'beethoven-fragment': p('form', 0, 'fragment', 'Вычленение мотива'),
  'schubert-minor': p('grammar', 2, 'mode-change', 'Изменение лада'),
  'schubert-flat-line': p('grammar', 2, 'scale-line', 'Ладовая линия'),
  'chopin-neighbor': p('grammar', 6, 'neighbor', 'Опевание'),
  'chopin-double-neighbor': p('grammar', 6, 'neighbor', 'Опевание'),
  'brahms-thirds': p('polyphony', 7, 'transpose', 'Перенос мотива'),
  'brahms-rising-thirds': p('polyphony', 7, 'transpose', 'Перенос мотива'),
  'debussy-whole-tone': p('modern', 1, 'whole-tone', 'Целотоновый звукоряд'),
  'debussy-five-step': p('grammar', 2, 'pentatonic', 'Пентатоническая линия'),
  'stravinsky-ostinato': p('form', 0, 'ostinato', 'Повторение ячейки'),
  'stravinsky-cell-groups': p('form', 0, 'reorder', 'Перестановка ячейки'),
  'clementi-scale': p('grammar', 2, 'scale-line', 'Ладовая линия'),
  'liszt-augmented': p('harmony', 2, 'augmented', 'Увеличенное трезвучие'),
  'ravel-seventh': p('harmony', 2, 'seventh', 'Септаккорд'),
  'vivaldi-return': p('form', 3, 'return', 'Возвращение темы'),
  'clementi-even': p('rhythm', 0, 'pulse', 'Ровный пульс'),
  'liszt-octaves': p('texture', 1, 'octave', 'Октавное удвоение'),
  'ravel-arpeggio': p('harmony', 2, 'arpeggio', 'Разложение созвучия'),
  'bach-sequence': p('harmony', 6, 'diatonic-sequence', 'Диатоническая секвенция'),
  'haydn-surprise': p('rhythm', 0, 'dynamics', 'Динамический контраст'),
  'mozart-alberti': p('texture', 0, 'alberti', 'Бас Альберти'),
  'beethoven-compression': p('rhythm', 5, 'diminution', 'Ритмическое уменьшение'),
  'schubert-pedal': p('harmony', 5, 'pedal', 'Педальный тон'),
  'chopin-suspension': p('harmony', 4, 'suspension', 'Задержание'),
  'brahms-variation': p('form', 4, 'variation', 'Ритмическая вариация'),
  'debussy-pentatonic': p('grammar', 2, 'pentatonic', 'Пентатоническая линия'),
  'stravinsky-displacement': p('rhythm', 1, 'syncopation', 'Смещение вступлений'),
  'webern-expansion': p('texture', 1, 'register', 'Сравнение регистров'),
  'baroque-bass': p('harmony', 5, 'bass-preserve', 'Сохранение басовой линии'),
  'bach-voices': p('polyphony', 3, 'exchange', 'Перестановка голосов'),
  'classical-period': p('harmony', 3, 'cadence', 'Доминанта и завершение'),
  'mozart-shadow': p('form', 0, 'contrast', 'Контрастный ответ'),
  'schubert-distance': p('harmony', 7, 'modulation', 'Смена тональной области'),
  'chopin-rubato': p('rhythm', 7, 'rubato', 'Гибкое время мелодии'),
  'debussy-color': p('modern', 2, 'planing', 'Параллельное движение созвучий'),
  'webern-space': p('texture', 1, 'spacing', 'Регистровое пространство'),
};
const listeningKinds: Record<string, TaskPlacement> = {
  pedal: p('harmony', 5, 'pedal', 'Педальный тон'),
  octave: p('texture', 1, 'octave', 'Октавное удвоение'),
  imitation: p('polyphony', 4, 'imitation', 'Точный имитационный ответ'),
  inversion: p('polyphony', 7, 'inversion', 'Обращение интервалов'),
  diminution: p('rhythm', 5, 'diminution', 'Ритмическое уменьшение'),
  augmentation: p('rhythm', 5, 'augmentation', 'Ритмическое увеличение'),
  accent: p('rhythm', 4, 'accents', 'Акцентная группировка'),
  return: p('form', 3, 'return', 'Возвращение темы'),
  chord: p('harmony', 2, 'arpeggio', 'Разложение созвучия'),
  syncopation: p('rhythm', 1, 'syncopation', 'Смещение вступлений'),
  staccato: p('rhythm', 0, 'articulation', 'Длительность и промежуток'),
  ostinato: p('form', 0, 'ostinato', 'Повторение ячейки'),
};
export const taskPlacements: Record<string, TaskPlacement> = { ...explicit };
for (const c of expandedCatalog.composers) {
  taskPlacements[c.listening.id] = listeningKinds[c.listening.kind];
  taskPlacements[c.practice.id] = p('grammar', 5, 'pitch-model', 'Собрать линию по условию');
}
for (const t of composerPaths) {
  taskPlacements[t.id] =
    t.kind === 'dictation'
      ? p('ear', 1, 'dictation', 'Мелодический диктант')
      : t.kind === 'recognize'
        ? p('ear', 4, 'recognize', 'Найдите изменённую ноту')
        : p('polyphony', 7, t.kind, t.kind === 'transpose' ? 'Перенос мотива' : 'Ракоход');
}
export const topicId = (domain: string, index: number) => `${domain}:${index}`;
export const topicCount = domains.reduce((n, d) => n + d.topics.length, 0);
export function atlasFamilies(
  tasks: Assignment[],
  domain?: string,
  topic?: number,
  query = '',
  format = 'all',
) {
  const q = normalizeCatalogQuery(query);
  const groups = new Map<
    string,
    { id: string; title: string; placement: TaskPlacement; tasks: Assignment[] }
  >();
  for (const t of tasks) {
    const place = taskPlacements[t.id];
    if (
      !place ||
      !interactiveIds.includes(t.id) ||
      (domain && place.domain !== domain) ||
      (topic !== undefined && place.topic !== topic)
    )
      continue;
    const kind = t.id.endsWith('-dictation')
      ? 'dictation'
      : styleExercises[t.id]
        ? 'listen'
        : 'build';
    if (format !== 'all' && format !== kind) continue;
    const area = domains.find((d) => d.id === place.domain)!;
    if (
      q &&
      !normalizeCatalogQuery(
        `${t.title} ${place.label} ${area.title} ${area.topics[place.topic]}`,
      ).includes(q)
    )
      continue;
    const id = `${place.domain}:${place.family}:${kind}`;
    if (!groups.has(id)) groups.set(id, { id, title: place.label, placement: place, tasks: [] });
    groups.get(id)!.tasks.push(t);
  }
  return [...groups.values()];
}
export function neutralAssignment(task: Assignment): Assignment {
  const placement = taskPlacements[task.id];
  const area = domains.find((d) => d.id === placement?.domain);
  return {
    ...task,
    composer: 'Учебная модель Forma',
    era: area?.title ?? 'Практика',
    placement: {
      ...task.placement,
      focus: area && placement ? area.topics[placement.topic] : 'Общая практика',
    },
  };
}
