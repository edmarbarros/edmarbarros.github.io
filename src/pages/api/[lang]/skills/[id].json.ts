import type { APIContext } from 'astro';
import type { Locale } from '../../../../i18n';
import { skills, type Skill } from '../../../../data/skills';
import { json, skillFullJson } from '../../../../content/api';

export function getStaticPaths() {
  return (['en', 'pt'] as const).flatMap((lang) =>
    skills.map((skill) => ({ params: { lang, id: skill.id }, props: { skill } })),
  );
}

export function GET({ params, props, site }: APIContext<{ skill: Skill }>) {
  return json(skillFullJson(props.skill, params.lang as Locale, site));
}
