import { getCv, getPost, getProject, listPosts, listProjects, listSkills } from './data';
import { backedBy, backerWords } from './backers';
import { formatSkillExperience } from './i18n';
import type { Lang } from './languages';
import type { SearchDoc } from './search';
import type { Cv, Env, PostFull, ProjectFull, SkillSummary } from './types';

/** Everything the search looks through, as fetched from the site. */
export interface SearchSources {
  lang: Lang;
  posts: PostFull[];
  projects: ProjectFull[];
  cv: Cv;
  skills: SkillSummary[];
}

/** Turn the site content into flat documents: what to match on, what to show. */
export function buildSearchDocs({ lang, posts, projects, cv, skills }: SearchSources): SearchDoc[] {
  return [
    ...posts.map((p) => ({
      type: 'post' as const,
      title: p.title,
      url: p.url,
      summary: p.summary,
      searchTitle: p.title,
      tags: p.tags.join(' '),
      text: `${p.summary}\n${p.body}`,
    })),
    ...projects.map((p) => ({
      type: 'project' as const,
      title: p.title,
      url: p.url,
      summary: p.summary,
      searchTitle: `${p.title} ${p.company ?? ''}`,
      tags: p.stack.join(' '),
      text: `${p.summary}\n${p.body}`,
    })),
    ...cv.experience.flatMap((c) =>
      c.roles.map((r) => ({
        type: 'experience' as const,
        title: `${r.role} at ${c.company}`,
        url: cv.url,
        summary: `${r.period}. ${c.blurb}`,
        searchTitle: `${r.role} ${c.company} ${backerWords(c.backers)}`,
        tags: r.stack.join(' '),
        text: `${c.blurb}\n${backedBy(c.backers)}\n${r.bullets.join('\n')}`,
      })),
    ),
    ...skills.map((s) => ({
      type: 'skill' as const,
      title: s.name,
      url: cv.url,
      summary:
        [formatSkillExperience(s, lang), s.level_label].filter(Boolean).join('. ') || s.group_label,
      searchTitle: `${s.name} ${s.aliases.join(' ')}`,
      tags: s.group_label,
      text: s.proof.join('\n'),
    })),
  ];
}

/** Fetch every source in one go and build the documents. All reads go through the edge cache. */
export async function loadSearchDocs(
  env: Env,
  lang: Lang,
  ctx?: ExecutionContext,
): Promise<SearchDoc[]> {
  const [postList, projectList, cv, skillList] = await Promise.all([
    listPosts(env, lang, ctx),
    listProjects(env, lang, ctx),
    getCv(env, lang, ctx),
    listSkills(env, lang, ctx),
  ]);
  const [posts, projects] = await Promise.all([
    Promise.all(postList.items.map((p) => getPost(env, lang, p.slug, ctx))),
    Promise.all(projectList.items.map((p) => getProject(env, lang, p.kind, p.slug, ctx))),
  ]);
  return buildSearchDocs({ lang, posts, projects, cv, skills: skillList.items });
}
