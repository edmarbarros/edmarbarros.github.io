import { z } from 'zod';
import { getCv } from '../data';
import { LANG_VALUES } from '../languages';
import type { Cv } from '../types';
import { READ_ONLY, guard, langField, ok, type ToolDeps } from './shared';

// Input ---------------------------------------------------------------------

const CV_SECTIONS = ['all', 'summary', 'experience', 'education', 'skills', 'languages'] as const;

const profileInput = { lang: langField };

const cvInput = {
  lang: langField,
  sections: z
    .array(z.enum(CV_SECTIONS))
    .default(['all'])
    .describe("Which parts to return. Default ['all']."),
};

// Formatting --------------------------------------------------------------------

const TOOL_NAMES =
  'site_get_cv, site_list_skills, site_get_skill, site_list_posts, site_get_post, site_list_projects, site_get_project, site_search';

function cvMarkdown(cv: Cv, sections: ReadonlySet<string>): string {
  const all = sections.has('all');
  const out: string[] = [`# ${cv.identity.name} — ${cv.identity.title}`, `${cv.identity.location}`];
  if (all || sections.has('summary')) out.push('', '## Summary', cv.summary);
  if (all || sections.has('experience')) {
    out.push('', '## Experience');
    for (const c of cv.experience) {
      out.push('', `### ${c.company}${c.url ? ` (${c.url})` : ''}`, c.blurb);
      for (const r of c.roles) {
        out.push('', `**${r.role}**, ${r.period}`);
        for (const b of r.bullets) out.push(`- ${b}`);
        if (r.stack.length) out.push(`Stack: ${r.stack.join(', ')}`);
      }
    }
  }
  if (all || sections.has('education')) {
    out.push('', '## Education');
    for (const e of cv.education) {
      out.push(
        `- ${e.degree}, ${e.institution}, ${e.location} (${e.period})${e.note ? `, ${e.note}` : ''}`,
      );
    }
  }
  if (all || sections.has('skills')) {
    out.push('', '## Skills');
    for (const s of cv.skills) out.push(`- **${s.label}:** ${s.items.join(', ')}`);
  }
  if (all || sections.has('languages')) {
    out.push('', '## Languages');
    for (const l of cv.languages) out.push(`- ${l.language}: ${l.level}`);
    out.push('', `Interests: ${cv.interests}`);
  }
  return out.join('\n');
}

// Tools -----------------------------------------------------------------------

export function registerProfileTools({ server, env, ctx }: ToolDeps): void {
  server.registerTool(
    'site_get_profile',
    {
      title: 'Get profile',
      description:
        "Short overview of Edmar Barros: who he is, where to find him, and what this server can tell you. Start here when you don't know what to ask.",
      inputSchema: profileInput,
      annotations: READ_ONLY,
    },
    ({ lang }) =>
      guard(async () => {
        const cv = await getCv(env, lang, ctx);
        const profile = {
          name: cv.identity.name,
          title: cv.identity.title,
          location: cv.identity.location,
          summary: cv.summary,
          links: {
            website: new URL('/', env.SITE_URL).href,
            cv_page: cv.url,
            cv_pdf: cv.pdf,
            linkedin: cv.identity.linkedin,
            github: cv.identity.github,
            twitter: cv.identity.twitter,
            email: cv.identity.email,
            rss: new URL('/rss.xml', env.SITE_URL).href,
          },
          languages: [...LANG_VALUES],
          latest_company: cv.experience[0]?.company ?? null,
        };
        const text = [
          `${profile.name}, ${profile.title}`,
          profile.location,
          '',
          profile.summary,
          '',
          `Website: ${profile.links.website}`,
          `CV (PDF): ${profile.links.cv_pdf}`,
          `LinkedIn: ${profile.links.linkedin}`,
          `GitHub: ${profile.links.github}`,
          `Email: ${profile.links.email}`,
          '',
          `Tools: ${TOOL_NAMES}.`,
        ].join('\n');
        return ok(text, profile);
      }),
  );

  server.registerTool(
    'site_get_cv',
    {
      title: 'Get CV',
      description:
        "Edmar's CV: summary, work experience with achievements and tech stack, education, skills and languages. Use `sections` to fetch only part of it.",
      inputSchema: cvInput,
      annotations: READ_ONLY,
    },
    ({ lang, sections }) =>
      guard(async () => {
        const cv = await getCv(env, lang, ctx);
        return ok(cvMarkdown(cv, new Set(sections)), cv);
      }),
  );
}
