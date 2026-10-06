import type { APIContext } from 'astro';
import type { Locale } from '../../../i18n';
import { getProjects } from '../../../content/helpers';
import { json, localePaths, projectSummaryJson } from '../../../content/api';

export const getStaticPaths = localePaths;

export async function GET({ params, site }: APIContext) {
  const lang = params.lang as Locale;
  const projects = await getProjects(lang);
  return json({
    lang,
    count: projects.length,
    items: projects.map((p) => projectSummaryJson(p, lang, site)),
  });
}
