import { requestJson } from '../http.ts';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type Viewer = { username: string; displayName: string; role: Role };
export type Person = Viewer & { id: number; enabled: boolean; version: number };
export type Group = { id: number; name: string; teacher: Person; students: Person[] };
export type Definition = {
  title: string;
  instruction: string;
  hint: string;
  tempo: number;
  initial: number[];
  reference: number[];
  editable: number[];
  allowed: number[];
  lastNote: number;
  checkMode?: 'CONDITIONS' | 'EXACT' | 'TRANSPOSE';
};
export type CheckResult = {
  passed: boolean;
  complete: boolean;
  message: string;
  incorrectSlots: number[];
};
export type Template = { id: number; version: number; definition: Definition; updatedAt: string };
export type Status = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'REVISION' | 'ACCEPTED';
export type WorkEvent = {
  id: number;
  kind: Status;
  notes: number[];
  comment: string;
  createdAt: string;
};
export type Work = {
  id: number;
  version: number;
  teacher: Person;
  student: Person;
  definition: Definition;
  notes: number[];
  status: Status;
  comment: string;
  dueDate: string | null;
  updatedAt: string;
  history: WorkEvent[];
};
export const statusLabel: Record<Status, string> = {
  NOT_STARTED: 'Не начато',
  DRAFT: 'Черновик',
  SUBMITTED: 'На проверке',
  REVISION: 'Доработать',
  ACCEPTED: 'Принято',
};
export const pitches = [60, 62, 64, 65, 66, 67, 69, 71, 72];
export function countWord(n: number, one: string, few: string, many: string) {
  const last = n % 10;
  const teen = n % 100;
  if (teen >= 11 && teen <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
export const preset = (): Definition => ({
  title: 'Мелодия: вопрос и ответ',
  instruction:
    'Прослушайте вопрос. Допишите две последние ноты, чтобы ответ завершился устойчиво на до.',
  hint: 'Сравните открытое окончание на ре и устойчивое на до.',
  tempo: 90,
  initial: [60, 62, 64, 67, 64, 62, 0, 0],
  reference: [60, 62, 64, 67, 64, 62, 64, 62],
  editable: [6, 7],
  allowed: [60, 62, 64, 65, 67, 69, 71, 72],
  lastNote: 60,
});
export const motivePreset = (): Definition => ({
  title: 'Мотив на новой высоте',
  instruction:
    'Прослушайте до–ре–ми. Во втором такте перенесите мотив на другую высоту, сохранив два восходящих целых тона. Четвёртая доля каждого такта — пауза.',
  hint: 'Попробуйте ре–ми–фа-диез. Прослушайте исходный мотив и своё продолжение подряд.',
  tempo: 90,
  initial: [60, 62, 64, 0, 0, 0, 0, 0],
  reference: [60, 62, 64, 0, 60, 62, 64, 0],
  editable: [4, 5, 6],
  allowed: [60, 62, 64, 65, 66, 67, 69, 71, 72],
  lastNote: 0,
  checkMode: 'TRANSPOSE',
});
export type ConstructorSeed = { kind: 'melody-question' | 'beethoven-motive'; key: number };
export type AuditEvent = {
  id: number;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
};
export function condition(definition: Definition, notes: number[]) {
  if (definition.editable.some((i) => notes[i] === 0)) return 'Заполните все изменяемые доли.';
  if (definition.lastNote && notes[7] !== definition.lastNote)
    return 'Проверьте последнюю ноту: она отличается от условия учителя.';
  return 'Формальные условия выполнены. Музыкальное решение оценит преподаватель.';
}
export function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  prefix = '/api/classroom',
): Promise<T> {
  return requestJson<T>(`${prefix}${path}`, method, body);
}
