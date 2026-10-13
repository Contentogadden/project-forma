export type Epoch = { slug: string; name: string; years: string; accent: string };
export type Composer = { slug: string; name: string; era: string; contribution: string };
export type MusicAspect = { slug: string; name: string; description: string; order: number };
export type LearningTask = {
  title: string;
  prompt: string;
  difficulty: string;
  aspects: string[];
  resultType: string;
};
export type LearningPrinciple = { author: string; principle: string; application: string };
export type LandingContent = {
  epochs: Epoch[];
  composers: Composer[];
  aspects: MusicAspect[];
  featuredTask: LearningTask;
  principles: LearningPrinciple[];
  taskSeries: LearningTask[];
};
