import type { Score } from './model.ts';
import type { StudyLesson, StudyQuestion } from './studyContent.ts';

export const musicTheorySource = (path: string) => ({
  title: 'Open Music Theory · ' + path,
  url: 'https://openmusictheory.github.io/' + path + '.html',
});

export const lesson = (
  id: string,
  domain: string,
  topic: number,
  title: string,
  goal: string,
  theory: [string, string],
  rule: string,
  example: string,
  paths: (string | StudyLesson['source'][number])[],
  questions: StudyQuestion[],
): StudyLesson => ({
  id,
  domain,
  topic,
  title,
  goal,
  theory,
  rule,
  example,
  source: paths.map((s) => (typeof s === 'string' ? musicTheorySource(s) : s)),
  questions,
});

export const choiceQuestion = (
  id: string,
  title: string,
  prompt: string,
  labels: string[],
  answer: number,
  explanation: string,
  hint: string,
  given?: Score,
  scores?: Score[],
  hideGiven = false,
): StudyQuestion => ({
  id,
  title,
  prompt,
  kind: 'choice',
  answer: [answer],
  options: labels.map((label, i) => ({ label, score: scores?.[i] })),
  explanation,
  hint,
  given,
  hideGiven,
});

export const noteQuestion = (
  id: string,
  title: string,
  prompt: string,
  answer: number[],
  explanation: string,
  hint: string,
  extra: Partial<StudyQuestion> = {},
): StudyQuestion => ({
  id,
  title,
  prompt,
  kind: 'notes',
  answer,
  noteChoices: Array.from({ length: 13 }, (_, i) => 60 + i),
  explanation,
  hint,
  ...extra,
});

export const pitchSetQuestion = (
  id: string,
  title: string,
  prompt: string,
  answer: number[],
  explanation: string,
  hint: string,
  given?: Score,
): StudyQuestion => ({ id, title, prompt, kind: 'set', answer, explanation, hint, given });

export const accentQuestion = (
  id: string,
  title: string,
  prompt: string,
  length: number,
  answer: number[],
  explanation: string,
  hint: string,
): StudyQuestion => ({
  id,
  title,
  prompt,
  kind: 'accents',
  length,
  pulseStep: 0.5,
  answer,
  explanation,
  hint,
});
