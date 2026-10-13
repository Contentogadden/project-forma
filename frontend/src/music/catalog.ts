import type { Assignment } from '../AssignmentSheet';
import { interactiveIds } from './model.ts';
export const periodOrder = ['baroque', 'classical', 'romantic', 'modern'];
export const readyIds = interactiveIds;
export const normalizeCatalogQuery = (query: string) =>
  query.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
export function filteredComposers<T extends { name: string }>(groups: T[], query = '') {
  const q = normalizeCatalogQuery(query);
  return groups.filter((c) => normalizeCatalogQuery(c.name).includes(q));
}
export function periodForEra(tasks: Assignment[], era?: string) {
  return tasks.find((t) => t.era === era)?.placement.periodId ?? null;
}
export function stylePeriods(tasks: Assignment[]) {
  return periodOrder.flatMap((id) => {
    const found = tasks.filter((t) => t.placement.periodId === id);
    return found.length ? [{ id, name: found[0].placement.periodName, tasks: found }] : [];
  });
}
export function composerGroups(tasks: Assignment[]) {
  const groups = new Map<string, { id: string; name: string; tasks: Assignment[] }>();
  for (const t of tasks) {
    const id = t.placement.composerId;
    if (!groups.has(id)) groups.set(id, { id, name: t.composer, tasks: [] });
    groups.get(id)!.tasks.push(t);
  }
  return [...groups.values()];
}
export function filteredTasks(tasks: Assignment[], aspect = 'Все', query = '') {
  const q = normalizeCatalogQuery(query);
  return tasks.filter(
    (t) =>
      (aspect === 'Все' || t.aspects.includes(aspect) || t.aspects.includes('Все аспекты')) &&
      normalizeCatalogQuery(`${t.title} ${t.composer} ${t.placement.focus}`).includes(q),
  );
}
