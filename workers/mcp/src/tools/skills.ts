import { z } from 'zod';
import { getSkillDetail, listSkills } from '../data';
import { SKILL_LABELS, formatCount, formatList, formatSkillExperience } from '../i18n';
import type { Lang } from '../languages';
import { lookupSkill } from '../skill-lookup';
import type { SkillFull, SkillSummary } from '../types';
import { READ_ONLY, fail, guard, langField, ok, type ToolDeps } from './shared';

// Input ---------------------------------------------------------------------

/** Also the order the groups are shown in. */
const SKILL_GROUPS = ['languages', 'cloud', 'data', 'practices'] as const;

const listSkillsInput = {
  lang: langField,
  group: z
    .enum(SKILL_GROUPS)
    .optional()
    .describe('Only one group: languages, cloud, data or practices.'),
};

const getSkillInput = {
  name: z
    .string()
    .min(1)
    .max(60)
    .describe("Skill or technology, e.g. 'SQL', 'Kafka', 'Terraform'."),
  lang: langField,
};

// Formatting --------------------------------------------------------------------

/** Longest-used first, then the best proven. */
const byExperience = (a: SkillSummary, b: SkillSummary) =>
  (b.years ?? -1) - (a.years ?? -1) || b.proof_count - a.proof_count;

function skillLine(s: SkillSummary, lang: Lang): string {
  const t = SKILL_LABELS[lang];
  const parts = [
    s.level_label ? `${t.listLevel}: ${s.level_label}` : '',
    formatSkillExperience(s, lang),
    s.proof_count ? formatCount(lang, s.proof_count, t.achievements) : '',
    s.listed_only ? t.listOnly : '',
  ].filter(Boolean);
  return `- **${s.name}** [${s.id}]: ${parts.join('; ')}`;
}

function formatSkillList(skills: SkillSummary[], note: string, lang: Lang): string {
  const sections = SKILL_GROUPS.flatMap((group) => {
    const inGroup = skills.filter((s) => s.group === group).sort(byExperience);
    if (inGroup.length === 0) return [];
    return [`## ${inGroup[0]!.group_label}`, ...inGroup.map((s) => skillLine(s, lang)), ''];
  });
  return `${skills.length} skill(s). ${note}\n\n${sections.join('\n')}`;
}

function formatSkillDetail(detail: SkillFull, lang: Lang): string {
  const t = SKILL_LABELS[lang];
  const lines = [`# ${detail.name}`, detail.group_label, ''];

  lines.push(`${t.level}: ${detail.level_label ?? t.levelNotStated}`);

  const experience = formatSkillExperience(detail, lang);
  if (experience) lines.push(`${t.experience}: ${experience}.`);
  else if (detail.proof.length > 0) lines.push(`${t.experience}: ${t.viaAchievements}`);
  else lines.push(`${t.experience}: ${t.noEvidence}`);

  if (detail.roles.length > 0) {
    lines.push('', `${t.usedIn}:`);
    for (const r of detail.roles) {
      lines.push(`- ${r.company}, ${r.role}, ${r.period} (${formatList(lang, r.used)})`);
    }
    if (detail.basis) lines.push('', detail.basis);
  }

  if (detail.proof.length > 0) {
    lines.push('', `${t.proof}:`);
    for (const p of detail.proof) lines.push(`- ${p}`);
  }
  return lines.join('\n');
}

// Tools -----------------------------------------------------------------------

export function registerSkillTools({ server, env, ctx }: ToolDeps): void {
  server.registerTool(
    'site_list_skills',
    {
      title: 'List skills with evidence',
      description:
        "Every skill on Edmar's CV with how long and where he has used it, and how many achievements prove it. Use it to see his strengths at a glance, then site_get_skill for the proof behind one.",
      inputSchema: listSkillsInput,
      annotations: READ_ONLY,
    },
    ({ lang, group }) =>
      guard(async () => {
        const { items, note } = await listSkills(env, lang, ctx);
        const shown = group ? items.filter((s) => s.group === group) : items;
        if (shown.length === 0) return ok('No skills found.', { count: 0, items: [] });
        return ok(formatSkillList(shown, note, lang), { count: shown.length, note, items: shown });
      }),
  );

  server.registerTool(
    'site_get_skill',
    {
      title: 'Get the evidence behind a skill',
      description:
        "How much experience Edmar has with one skill or technology, with the roles where it was used and the achievements that prove it. Accepts a name or common alias such as 'SQL', 'Postgres', 'k8s' or 'CI/CD'. Use this instead of guessing proficiency from the CV.",
      inputSchema: getSkillInput,
      annotations: READ_ONLY,
    },
    ({ name, lang }) =>
      guard(async () => {
        const { items } = await listSkills(env, lang, ctx);
        const found = lookupSkill(items, name);
        if (found.kind === 'missing') {
          return fail(
            `No skill matches "${name}". Available skills: ${items.map((s) => s.name).join(', ')}. Try site_search for anything else.`,
          );
        }
        if (found.kind === 'ambiguous') {
          return fail(
            `"${name}" matches several skills: ${found.skills.map((s) => `${s.name} [${s.id}]`).join(', ')}. Ask again with one of those names.`,
          );
        }
        const detail = await getSkillDetail(env, lang, found.skill.id, ctx);
        return ok(formatSkillDetail(detail, lang), detail);
      }),
  );
}
