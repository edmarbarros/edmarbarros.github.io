import type { APIContext } from 'astro';
import type { Locale } from '../../../../../i18n';
import { getProjects, projectSlug, type ProjectEntry } from '../../../../../content/helpers';
import { json, projectFullJson } from '../../../../../content/api';

export async function getStaticPaths() {
  const paths = [];
  for (const lang of ['en', 'pt'] as const) {
    const projects = await getProjects(lang);
    for (const project of projects) {
      paths.push({
        params: { lang, kind: project.data.kind, slug: projectSlug(project) },
        props: { project },
      });
    }
  }
  return paths;
}

export async function GET({ params, props, site }: APIContext<{ project: ProjectEntry }>) {
  return json(projectFullJson(props.project, params.lang as Locale, site));
}
