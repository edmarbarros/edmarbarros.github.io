import type { APIContext } from 'astro';
import { SITE_CONFIG } from '../config';
import { absoluteUrl, projectUrl } from '../content/api';
import { getPosts, getProjects, postUrl } from '../content/helpers';
import { cv } from '../data/cv';

/**
 * /llms.txt: a short markdown guide for AI assistants and the people using them.
 * Built from the same data as the pages, so it never lists something that is gone
 * or misses something new. See https://llmstxt.org for the format.
 */
export async function GET({ site }: APIContext) {
  const url = (path: string) => absoluteUrl(path, site);
  const [projects, posts] = await Promise.all([getProjects('en'), getPosts('en')]);
  const { identity } = cv;

  const lines = [
    `# ${identity.name}`,
    '',
    `> ${identity.title.en}, ${identity.location.en}. Personal site with a CV, project write-ups and a blog, in English and Brazilian Portuguese.`,
    '',
    cv.summary.en,
    '',
    '## About',
    '',
    `- [CV](${url('/cv')}): experience, skills and education.`,
    `- [CV as a PDF](${url(cv.pdf.en)}): the same CV, ready to download.`,
    `- [Contact](${url('/contact')}): the contact form.`,
    '',
    '## Projects',
    '',
    ...projects.map(
      (p) =>
        `- [${p.data.title}](${url(projectUrl(p, 'en'))}): ${p.data.period}. ${p.data.summary}`,
    ),
    '',
    '## Blog',
    '',
    ...(posts.length > 0
      ? posts.map((p) => `- [${p.data.title}](${url(postUrl(p, 'en'))}): ${p.data.summary}`)
      : ['- No posts yet.']),
    '',
    '## Ask an assistant about him',
    '',
    `- [MCP server](${SITE_CONFIG.mcpEndpoint}): a remote MCP server that answers from this site. It reads the CV, skills with evidence, projects and posts, and can search them. It also drafts a message to him that the person reviews and sends on the contact page. No sign-in is needed.`,
    `- [How to connect](${url('/#mcp')}): setup steps for Claude, ChatGPT, Cursor, VS Code and other clients.`,
    '',
    '## Optional',
    '',
    `- [Português](${url('/pt')}): the same site in Brazilian Portuguese.`,
    `- [RSS feed](${url('/rss.xml')}): blog updates.`,
    `- [Sitemap](${url('/sitemap-index.xml')}): every page.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
