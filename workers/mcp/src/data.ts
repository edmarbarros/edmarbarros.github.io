import type {
  Cv,
  Env,
  ListResponse,
  PostFull,
  PostSummary,
  ProjectFull,
  ProjectSummary,
  SkillFull,
  SkillsList,
} from './types';
import type { Lang } from './languages';
import { fetchSiteJson } from './site-client';

export const listPosts = (env: Env, lang: Lang, ctx?: ExecutionContext) =>
  fetchSiteJson<ListResponse<PostSummary>>(env, `/api/${lang}/posts.json`, ctx);

export const getPost = (env: Env, lang: Lang, slug: string, ctx?: ExecutionContext) =>
  fetchSiteJson<PostFull>(env, `/api/${lang}/posts/${encodeURIComponent(slug)}.json`, ctx);

export const listProjects = (env: Env, lang: Lang, ctx?: ExecutionContext) =>
  fetchSiteJson<ListResponse<ProjectSummary>>(env, `/api/${lang}/projects.json`, ctx);

export const getProject = (
  env: Env,
  lang: Lang,
  kind: string,
  slug: string,
  ctx?: ExecutionContext,
) =>
  fetchSiteJson<ProjectFull>(
    env,
    `/api/${lang}/projects/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}.json`,
    ctx,
  );

export const getCv = (env: Env, lang: Lang, ctx?: ExecutionContext) =>
  fetchSiteJson<Cv>(env, `/api/${lang}/cv.json`, ctx);

export const listSkills = (env: Env, lang: Lang, ctx?: ExecutionContext) =>
  fetchSiteJson<SkillsList>(env, `/api/${lang}/skills.json`, ctx);

export const getSkillDetail = (env: Env, lang: Lang, id: string, ctx?: ExecutionContext) =>
  fetchSiteJson<SkillFull>(env, `/api/${lang}/skills/${encodeURIComponent(id)}.json`, ctx);
