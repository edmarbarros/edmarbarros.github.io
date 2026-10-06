import type { APIContext } from 'astro';
import type { Locale } from '../../../i18n';
import { cvJson, json, localePaths } from '../../../content/api';

export const getStaticPaths = localePaths;

export function GET({ params, site }: APIContext) {
  return json(cvJson(params.lang as Locale, site));
}
