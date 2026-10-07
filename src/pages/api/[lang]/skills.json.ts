import type { APIContext } from 'astro';
import type { Locale } from '../../../i18n';
import { json, localePaths, skillsListJson } from '../../../content/api';

export const getStaticPaths = localePaths;

export function GET({ params, site }: APIContext) {
  return json(skillsListJson(params.lang as Locale, site));
}
