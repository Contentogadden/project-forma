import { makeQuestion, type DrillKind, type DrillQuestion } from './drills.ts';
export type PracticeMemory = {
  mistakes: Record<string, number>;
  streak: number;
  lastWeak: string | null;
};
export const emptyMemory = (): PracticeMemory => ({ mistakes: {}, streak: 0, lastWeak: null });
export function recordAnswer(
  m: PracticeMemory,
  q: DrillQuestion,
  correct: boolean,
): PracticeMemory {
  const count = m.mistakes[q.answer] ?? 0;
  return {
    mistakes: { ...m.mistakes, [q.answer]: correct ? Math.max(0, count - 1) : count + 1 },
    streak: correct ? m.streak + 1 : 0,
    lastWeak: correct ? m.lastWeak : q.answer,
  };
}
export function adaptiveQuestion(
  kind: DrillKind,
  index: number,
  m: PracticeMemory,
  random = Math.random,
) {
  const weakest = Object.entries(m.mistakes).sort((a, b) => b[1] - a[1])[0];
  const focus = weakest && weakest[1] > 0 && index % 3 !== 2 ? weakest[0] : null;
  let q = makeQuestion(kind, index, random);
  if (focus)
    for (let i = 0; i < 80 && q.answer !== focus; i++) q = makeQuestion(kind, index, random);
  return {
    question: q,
    tempo: weakest && weakest[1] >= 2 ? 60 : 80,
    focused: !!focus && q.answer === focus,
  };
}
