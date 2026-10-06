import type { APIContext } from 'astro';
import type { Locale } from '../../../../i18n';
import { getPosts, postSlug, type PostEntry } from '../../../../content/helpers';
import { json, postFullJson } from '../../../../content/api';

export async function getStaticPaths() {
  const paths = [];
  for (const lang of ['en', 'pt'] as const) {
    const posts = await getPosts(lang);
    for (const post of posts) {
      paths.push({ params: { lang, slug: postSlug(post) }, props: { post } });
    }
  }
  return paths;
}

export async function GET({ params, props, site }: APIContext<{ post: PostEntry }>) {
  return json(postFullJson(props.post, params.lang as Locale, site));
}
