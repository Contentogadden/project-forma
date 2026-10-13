import portraits from './expandedPortraits.json' with { type: 'json' };
import { expandedCatalog } from './expandedPractice.ts';
export type ComposerInfo = {
  years: string;
  gesture: string;
  source: string;
  credit: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl?: string;
  context?: string;
};
const portraitData: Record<
  string,
  { source: string; credit: string; license: string; licenseUrl: string; sourceUrl: string }
> = portraits;
export const composers: Record<string, ComposerInfo> = {
  ...Object.fromEntries(
    expandedCatalog.composers.map((c) => [
      c.id,
      {
        years: c.years,
        gesture: c.gesture,
        ...(portraitData[c.id] ?? { source: '', credit: 'Типографическая карточка Forma' }),
      },
    ]),
  ),
  vivaldi: {
    years: '1678–1741',
    gesture: 'Повторение и секвенция',
    source: 'Vivaldi.jpg',
    credit: 'Неизвестный художник; предполагаемый портрет Вивальди',
  },
  clementi: {
    years: '1752–1832',
    gesture: 'Гамма и ясная фактура',
    source: 'Muzio_Clementi.jpeg',
    credit: 'Томас Харди',
  },
  liszt: {
    years: '1811–1886',
    gesture: 'Регистр и напряжение созвучий',
    source: 'Franz_Liszt_by_Nadar,_March_1886.png',
    credit: 'Надар, 1886',
  },
  ravel: {
    years: '1875–1937',
    gesture: 'Созвучие и прозрачная фактура',
    source: 'Maurice_Ravel_1925.jpg',
    credit: 'Неизвестный фотограф; Bibliothèque nationale de France, 1925',
  },
  bach: {
    years: '1685–1750',
    gesture: 'Голос отвечает голосу',
    source: 'Johann_Sebastian_Bach.jpg',
    credit: 'Элиас Готлоб Хаусман',
  },
  haydn: {
    years: '1732–1809',
    gesture: 'Ожидание и завершение',
    source: 'Joseph_Haydn.jpg',
    credit: 'Томас Харди',
  },
  mozart: {
    years: '1756–1791',
    gesture: 'Ясная линия и живой жест',
    source: 'The_Mozart_Family_-_Wolfgang_Amadeus_Mozart_headshot.jpg',
    credit: 'Иоганн Непомук делла Кроче',
  },
  beethoven: {
    years: '1770–1827',
    gesture: 'Мотив становится развитием',
    source: 'Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg',
    credit: 'Йозеф Карл Штилер',
  },
  schubert: {
    years: '1797–1828',
    gesture: 'Песенная линия, смена света',
    source: 'Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg',
    credit: 'Вильгельм Август Ридер',
  },
  chopin: {
    years: '1810–1849',
    gesture: 'Дыхание фортепианной фразы',
    source: 'Frederic_Chopin_photo.jpeg',
    credit: 'Луи-Огюст Биссон',
  },
  brahms: {
    years: '1833–1897',
    gesture: 'Мотив и внутренний ритм',
    source: 'JohannesBrahms_(cropped).jpg',
    credit: 'C. Brasch, Берлин',
  },
  debussy: {
    years: '1862–1918',
    gesture: 'Гармония как краска',
    source: 'Claude_Debussy_by_Atelier_Nadar.jpg',
    credit: 'Ателье Nadar; реставрация Adam Cuerden',
  },
  stravinsky: {
    years: '1882–1971',
    gesture: 'Повторение и смещение',
    source: 'Igor_Stravinsky_LOC_32392u.jpg',
    credit: 'Коллекция George Grantham Bain',
  },
  webern: {
    years: '1883–1945',
    gesture: 'Короткий жест, большая пауза',
    source: 'Anton_Webern_in_Stettin,_October_1912.jpg',
    credit: 'Историческая фотография, 1912',
  },
};
const transitions: Record<string, string> = {
  monteverdi: 'Ренессанс → барокко. В каталоге выбран барочный учебный маршрут.',
  sweelinck: 'Ренессанс → барокко. В каталоге выбран барочный учебный маршрут.',
  cpebach: 'Барокко → классицизм. В каталоге выбран классический учебный маршрут.',
  hummel: 'Классицизм → ранний романтизм. Здесь выбран классический маршрут.',
  dussek: 'Классицизм → ранний романтизм. Здесь выбран классический маршрут.',
  reicha: 'Классицизм → ранний романтизм. Здесь выбран классический маршрут.',
  cherubini: 'Классицизм → ранний романтизм. Здесь выбран классический маршрут.',
  kuhlau: 'Классицизм → ранний романтизм. Здесь выбран классический маршрут.',
  satie:
    'Рубеж XIX–XX веков. Модернизм здесь — навигационный маршрут, не жёсткая граница творчества.',
};
for (const [id, context] of Object.entries(transitions)) composers[id].context = context;
export const portraitSource = (id: string) =>
  composers[id].sourceUrl ?? `https://commons.wikimedia.org/wiki/File:${composers[id].source}`;
