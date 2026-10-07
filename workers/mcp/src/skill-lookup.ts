import type { SkillSummary } from './types';

export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .trim();

export type SkillLookup =
  | { kind: 'found'; skill: SkillSummary }
  | { kind: 'ambiguous'; skills: SkillSummary[] }
  | { kind: 'missing' };

/**
 * Resolve free text such as "sql", "Postgres" or "k8s" to a skill.
 * An exact id, name or alias wins. Otherwise a single partial match is accepted,
 * and several partial matches are reported so the caller can ask which one.
 */
export function lookupSkill(skills: SkillSummary[], query: string): SkillLookup {
  const q = normalize(query);
  if (!q) return { kind: 'missing' };

  const direct = skills.find((s) => normalize(s.id) === q || normalize(s.name) === q);
  if (direct) return { kind: 'found', skill: direct };

  const viaAlias = skills.filter((s) => s.aliases.some((a) => normalize(a) === q));
  if (viaAlias.length === 1) return { kind: 'found', skill: viaAlias[0]! };
  if (viaAlias.length > 1) return { kind: 'ambiguous', skills: viaAlias };

  const partial = skills.filter(
    (s) =>
      normalize(s.name).includes(q) ||
      s.aliases.some((a) => normalize(a).includes(q)) ||
      (q.length > 2 && normalize(s.name).length > 2 && q.includes(normalize(s.name))),
  );
  if (partial.length === 1) return { kind: 'found', skill: partial[0]! };
  if (partial.length > 1) return { kind: 'ambiguous', skills: partial };
  return { kind: 'missing' };
}
