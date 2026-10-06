import type { APIContext } from 'astro';
import type { Locale } from '../../../i18n';
import { getPosts } from '../../../content/helpers';
import { json, localePaths, postSummaryJson } from '../../../content/api';

export const getStaticPaths = localePaths;

export async function GET({ params, site }: APIContext) {
  const lang = params.lang as Locale;
  const posts = await getPosts(lang);
  return json({
    lang,
    count: posts.length,
    items: posts.map((p) => postSummaryJson(p, lang, site)),
  });
}
