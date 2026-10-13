export type PracticeTarget = { task?: string; aspect?: string; era?: string; domain?: string };
export const practiceDoors = [
  {
    aspect: 'Мелодия',
    task: 'melody-question',
    image: '/art-concert.jpeg',
    action: 'Допишите окончание',
    alt: 'Музыканты с лютней',
  },
  {
    aspect: 'Гармония',
    task: 'harmony-home',
    image: '/art-harmony.jpeg',
    action: 'Подберите аккорды',
    alt: 'Урок танца под фортепиано',
  },
  {
    aspect: 'Ритм',
    task: 'rhythm-shift',
    image: '/art-dancers.jpeg',
    action: 'Расставьте акценты',
    alt: 'Танцующие фигуры',
  },
  {
    aspect: 'Форма',
    task: 'form-return',
    image: '/art-form.jpeg',
    action: 'Соберите музыкальную форму',
    alt: 'Концерт в павильоне',
  },
  {
    aspect: 'Тембр',
    task: 'timbre-register',
    image: '/art-portrait.jpeg',
    action: 'Сравните звучание регистров',
    alt: 'Исторический портрет',
  },
] as const;
