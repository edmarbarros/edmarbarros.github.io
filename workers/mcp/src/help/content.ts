import { LANGUAGES, type Lang } from '../languages';

/** Text in each supported language. Keys come from LANGUAGES, so a missing translation fails the type check. */
export type Localized<T> = Record<Lang, T>;

const { EN, PT } = LANGUAGES;

/**
 * The name people give the server when they add it. Commands are shown with it,
 * as in /edmarbarros:overview. Anyone who picked another name sees that one instead.
 */
export const COMMAND_PREFIX = 'edmarbarros';

export const HELP_TEXT: Localized<{
  title: string;
  intro: string;
  examples: string;
  commands: string;
  commandsNote: string;
  tools: string;
  goodToKnow: string;
  tips: string[];
}> = {
  [EN]: {
    title: 'What you can ask about Edmar Barros',
    intro:
      'Ask in plain language. The answers come from the content of this site: his CV, skills with evidence, projects and writing.',
    examples: 'Example questions',
    commands: 'Guided commands',
    commandsNote: `Clients that support MCP prompts, such as Claude Code, show these as commands. They use the name the server was added under, shown here as ${COMMAND_PREFIX}.`,
    tools: 'What the server can look up',
    goodToKnow: 'Good to know',
    tips: [
      'Ask for evidence. Skill answers include the years, the roles and the achievements behind them.',
      'Where the site does not state something, such as a skill level or availability, the answer says so instead of guessing.',
      'Ask in Portuguese to get Brazilian Portuguese answers.',
    ],
  },
  [PT]: {
    title: 'O que você pode perguntar sobre Edmar Barros',
    intro:
      'Pergunte em linguagem natural. As respostas vêm do conteúdo deste site: CV, habilidades com evidências, projetos e textos.',
    examples: 'Exemplos de perguntas',
    commands: 'Comandos guiados',
    commandsNote: `Clientes com suporte a prompts MCP, como o Claude Code, mostram estes como comandos. Eles usam o nome com que o servidor foi adicionado, aqui ${COMMAND_PREFIX}.`,
    tools: 'O que o servidor consegue consultar',
    goodToKnow: 'Bom saber',
    tips: [
      'Peça evidências. As respostas sobre habilidades trazem os anos, os cargos e as conquistas que as sustentam.',
      'Quando o site não informa algo, como o nível de uma habilidade ou a disponibilidade, a resposta diz isso em vez de chutar.',
      'Pergunte em português para receber respostas em português do Brasil.',
    ],
  },
};

export interface ExampleGroup {
  title: Localized<string>;
  questions: Localized<string[]>;
}

/** Every question here is checked against the real data before it is listed. */
export const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    title: { [EN]: 'If you are hiring', [PT]: 'Se você está recrutando' },
    questions: {
      [EN]: [
        'Give me a short overview of Edmar and his strongest skills.',
        'How much SQL experience does he have, and what proves it?',
        'What did he build at Quander?',
        'Write a message to Edmar saying I would like to talk about a role.',
      ],
      [PT]: [
        'Faça um resumo do Edmar e de suas principais habilidades.',
        'Quanta experiência ele tem com SQL e o que comprova isso?',
        'O que ele construiu na Quander?',
        'Escreva uma mensagem ao Edmar dizendo que quero conversar sobre uma vaga.',
      ],
    },
  },
  {
    title: { [EN]: 'If you want the technical detail', [PT]: 'Se você quer o detalhe técnico' },
    questions: {
      [EN]: [
        'Which of his projects used Kafka?',
        'What did he do with Elasticsearch?',
        'Show the Vendoo staff project write-up.',
      ],
      [PT]: [
        'Quais projetos dele usaram Kafka?',
        'O que ele fez com Elasticsearch?',
        'Mostre o texto do projeto de staff na Vendoo.',
      ],
    },
  },
  {
    title: { [EN]: 'If you are just curious', [PT]: 'Se você está só curioso' },
    questions: {
      [EN]: ['What has he written on the blog?', 'Show his CV in Portuguese.'],
      [PT]: ['O que ele já escreveu no blog?', 'Mostre o CV dele em inglês.'],
    },
  },
];

export interface HelpEntry {
  name: string;
  summary: Localized<string>;
}

export interface PromptHelp extends HelpEntry {
  /** Arguments as typed, for example '<skill>'. Empty when there are none. */
  usage: string;
}

/** Must match the registered prompts. A test fails when they drift apart. */
export const PROMPT_HELP: PromptHelp[] = [
  {
    name: 'overview',
    usage: '',
    summary: {
      [EN]: 'A recruiter-style first look: who he is, his strongest skills with evidence, his recent work.',
      [PT]: 'Uma primeira visão para recrutadores: quem ele é, suas principais habilidades com evidências, seu trabalho recente.',
    },
  },
  {
    name: 'skills-check',
    usage: '<skill>',
    summary: {
      [EN]: 'How much experience he has with one skill, with the roles and achievements behind it.',
      [PT]: 'Quanta experiência ele tem com uma habilidade, com os cargos e as conquistas por trás.',
    },
  },
  {
    name: 'role-fit',
    usage: '<job description>',
    summary: {
      [EN]: 'Paste a job description. Each requirement is matched to evidence, and gaps are stated plainly.',
      [PT]: 'Cole uma descrição de vaga. Cada requisito é relacionado a evidências, e as lacunas são ditas com clareza.',
    },
  },
  {
    name: 'help',
    usage: '',
    summary: {
      [EN]: 'Shows this guide.',
      [PT]: 'Mostra este guia.',
    },
  },
];

/** Must match the registered tools. A test fails when they drift apart. */
export const TOOL_HELP: HelpEntry[] = [
  {
    name: 'site_help',
    summary: {
      [EN]: 'This guide: what to ask and what is available.',
      [PT]: 'Este guia: o que perguntar e o que está disponível.',
    },
  },
  {
    name: 'site_draft_message',
    summary: {
      [EN]: 'Drafts a message to Edmar and gives you a link to review and send it.',
      [PT]: 'Rascunha uma mensagem ao Edmar e dá um link para você revisar e enviar.',
    },
  },
  {
    name: 'site_get_profile',
    summary: {
      [EN]: 'A short overview and where to find him.',
      [PT]: 'Uma visão geral curta e onde encontrá-lo.',
    },
  },
  {
    name: 'site_get_cv',
    summary: { [EN]: 'His CV, in full or by section.', [PT]: 'O CV dele, completo ou por seção.' },
  },
  {
    name: 'site_list_skills',
    summary: {
      [EN]: 'Every skill with years, roles and achievements.',
      [PT]: 'Todas as habilidades com anos, cargos e conquistas.',
    },
  },
  {
    name: 'site_get_skill',
    summary: {
      [EN]: 'The evidence behind one skill, such as SQL.',
      [PT]: 'A evidência por trás de uma habilidade, como SQL.',
    },
  },
  {
    name: 'site_list_projects',
    summary: { [EN]: 'His projects and roles.', [PT]: 'Seus projetos e cargos.' },
  },
  {
    name: 'site_get_project',
    summary: { [EN]: 'One project write-up in full.', [PT]: 'O texto completo de um projeto.' },
  },
  {
    name: 'site_list_posts',
    summary: { [EN]: 'His blog posts.', [PT]: 'Seus posts do blog.' },
  },
  {
    name: 'site_get_post',
    summary: { [EN]: 'One blog post in full.', [PT]: 'Um post do blog completo.' },
  },
  {
    name: 'site_search',
    summary: {
      [EN]: 'Search across posts, projects, experience and skills.',
      [PT]: 'Busca em posts, projetos, experiência e habilidades.',
    },
  },
];
