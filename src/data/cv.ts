import type { Locale } from '../i18n';
import type { MonthStr } from './duration';

export type Bilingual = Record<Locale, string>;
export type BilingualList = Record<Locale, string[]>;

export interface Role {
  role: Bilingual;
  startMonth: MonthStr;
  endMonth: MonthStr;
  bullets: BilingualList;
  stack: string[];
}

/** An investor or accelerator that backed a company. */
export interface Backer {
  /** Full name, for prose and search, such as 'Y Combinator'. */
  name: string;
  /** What people write next to a company name, such as 'YC'. Defaults to the name. */
  short?: string;
  /** Batch or program, such as 'W22'. */
  detail?: string;
}

/** 'YC W22', 'Techstars', 'Accel'. */
export function backerLabel(backer: Backer): string {
  return [backer.short ?? backer.name, backer.detail].filter(Boolean).join(' ');
}

export interface Company {
  company: string;
  location: string;
  url?: string;
  /** Who backed the company while I worked there. */
  backers?: Backer[];
  blurb: Bilingual;
  roles: Role[];
}

export interface Education {
  institution: string;
  degree: Bilingual;
  period: string;
  location: string;
  note?: Bilingual;
}

export interface LanguageEntry {
  language: Bilingual;
  level: Bilingual;
  note?: Bilingual;
}

export interface SkillGroup {
  label: Bilingual;
  items: string[];
}

export interface SoftSkill {
  label: Bilingual;
  description: Bilingual;
}

export interface CV {
  identity: {
    name: string;
    title: Bilingual;
    location: Bilingual;
    email: string;
    linkedin: string;
    github: string;
    twitter?: string;
    photo: string;
  };
  summary: Bilingual;
  quote: Bilingual;
  quoteAuthor: string;
  experience: Company[];
  education: Education[];
  skills: SkillGroup[];
  socialSkills: SoftSkill[];
  languages: LanguageEntry[];
  interests: Bilingual;
  pdf: {
    en: string;
    pt: string;
  };
}

export const cv: CV = {
  identity: {
    name: 'Edmar Barros',
    title: {
      en: 'Staff Software Engineer',
      pt: 'Staff Software Engineer',
    },
    location: { en: 'Brazil · Remote', pt: 'Brasil · Remoto' },
    email: 'hello[at]edmarbarros[.]com',
    linkedin: 'https://linkedin.com/in/edmarbarros/',
    github: 'https://github.com/edmarbarros',
    twitter: '@edmarbarros_',
    photo: '/images/edmar.jpg',
  },
  summary: {
    en: 'Staff Software Engineer with 10+ years building and operating production-grade distributed systems, most recently building AI-driven growth tooling at Quander (Hypesonic). I tie engineering work to business outcomes: opened a self-serve revenue stream with Stripe subscriptions, improved an unbalanced Elasticsearch cluster to cut its cost by 41%, halved new-engineer ramp-up time and reduced customer onboarding from 2 weeks to 1 day. Specialized in backend architecture (monolith-to-microservices), cloud infrastructure (GCP, AWS, Terraform, Kubernetes), CI/CD and data platforms (PostgreSQL, Kafka, Elasticsearch, BigQuery).',
    pt: 'Staff Software Engineer com mais de 10 anos construindo e operando sistemas distribuídos em produção, mais recentemente construindo ferramentas de crescimento orientadas por IA na Quander (Hypesonic). Conecto engenharia a resultados de negócio: abri uma nova fonte de receita self-service com assinaturas no Stripe, melhorei um cluster Elasticsearch desbalanceado, reduzindo seu custo em 41%, reduzi pela metade o tempo de ramp-up de novos engenheiros e diminuí o onboarding de clientes de 2 semanas para 1 dia. Especializado em arquitetura backend (monolito para microsserviços), infraestrutura em nuvem (GCP, AWS, Terraform, Kubernetes), CI/CD e plataformas de dados (PostgreSQL, Kafka, Elasticsearch, BigQuery).',
  },
  quote: {
    en: 'The mind that opens to a new idea never returns to its original size.',
    pt: 'A mente que se abre a uma nova ideia jamais volta ao seu tamanho original.',
  },
  quoteAuthor: 'Albert Einstein',
  experience: [
    {
      company: 'Quander',
      location: 'Remote',
      url: 'https://hypesonic.com/',
      backers: [{ name: 'Accel' }],
      blurb: {
        en: 'Maker of Hypesonic, an AI growth platform that runs marketing and distribution continuously: testing creative, targeting audiences and optimizing ad spend without human bottlenecks.',
        pt: 'Criadora da Hypesonic, plataforma de crescimento com IA que executa marketing e distribuição de forma contínua: testando criativos, segmentando públicos e otimizando o investimento em anúncios sem gargalos humanos.',
      },
      roles: [
        {
          role: { en: 'Senior Software Engineer', pt: 'Senior Software Engineer' },
          startMonth: '2026-05',
          endMonth: '2026-10',
          bullets: {
            en: [
              'Observable agent: Added Langfuse tracing for the Sonic in-product agent and moved its prompts into Langfuse, so runs could be inspected and prompts managed outside the code.',
              'Agent sessions that survive: Made agent sessions recover after a reboot and rehydrate on cold start, and fixed retry, stale-response and attachment problems so the agent kept its context.',
              'Tools for the agent: Gave the agent tools to read Meta performance data, search TikTok ads live, and search ads by demographics and creative dimensions.',
              'A sourcing agent for the ad library: Built an agent in the background workers that collects ads into a global library, scoped by a declare-scope tool, with media re-hosted on S3 and analyzed with Gemini.',
              'LLM-written reports: Built LLM narration for the weekly performance report with a provider abstraction, a validator and prompts, saving each result with its validator warnings.',
              'Self-serve revenue: Built Stripe subscriptions, a paywall and credit top-ups, with agent token use priced and debited atomically, so customers can sign up and pay on their own. Before this, B2B customers were billed manually.',
              'Meta sync rebuilt: Rebuilt the Meta ad sync around a per-ad model that cut Meta API cost about 25x, with daily demographics, checkpointed and resumable runs, and an ETA that only falls.',
              'Ad publishing: Built the Meta Ad Launcher, a step-by-step wizard for batch publishing with copy variants, dynamic creative and fix-and-relaunch, plus the TikTok advertiser connection and ad sync.',
              'Observability: Built a shared logger and an OpenTelemetry bootstrap with trace propagation, RED, LLM, ffmpeg and data-sync metrics, and a shared PostHog package.',
              'Video editor: Built the video editor and its engine as a workspace package, with Whisper transcription, caption templates and cost telemetry.',
              'Closing the loop with users: Joined beta tester calls and walked through onboarding in the platform to see where users struggled, asked what they expected, and guided them to features that covered what they called missing. Also joined twice-weekly calls with an agency using the platform and turned its feedback into fixes and features.',
            ],
            pt: [
              'Agente observável: Adicionei tracing do Langfuse ao agente Sonic do produto e movi seus prompts para o Langfuse, para que as execuções pudessem ser inspecionadas e os prompts gerenciados fora do código.',
              'Sessões do agente que sobrevivem: Fiz as sessões do agente se recuperarem após um reboot e se reidratarem em cold start, e corrigi problemas de retry, respostas obsoletas e anexos para que o agente mantivesse o contexto.',
              'Ferramentas para o agente: Dei ao agente ferramentas para ler dados de desempenho da Meta, buscar anúncios do TikTok ao vivo e buscar anúncios por dados demográficos e dimensões criativas.',
              'Um agente de coleta para a biblioteca de anúncios: Construí um agente nos workers em segundo plano que reúne anúncios em uma biblioteca global, delimitado por uma ferramenta de declaração de escopo, com mídia re-hospedada no S3 e analisada com o Gemini.',
              'Relatórios escritos por LLM: Construí a narração por LLM do relatório semanal de desempenho com uma abstração de provedor, um validador e prompts, salvando cada resultado com seus avisos do validador.',
              'Receita self-service: Construí assinaturas no Stripe, paywall e recargas de créditos, com o uso de tokens do agente precificado e debitado de forma atômica, para que clientes se cadastrem e paguem sozinhos. Antes disso, clientes B2B eram cobrados manualmente.',
              'Sincronização da Meta reconstruída: Reconstruí a sincronização de anúncios da Meta em torno de um modelo por anúncio que reduziu o custo da API da Meta em cerca de 25x, com dados demográficos diários, execuções com checkpoint e retomáveis, e uma estimativa de tempo que só diminui.',
              'Publicação de anúncios: Construí o Meta Ad Launcher, um wizard passo a passo para publicação em lote com variações de texto, criativo dinâmico e corrigir e relançar, além da conexão de anunciante do TikTok e da sincronização de anúncios.',
              'Observabilidade: Construí um logger compartilhado e um bootstrap de OpenTelemetry com propagação de traces, métricas RED, de LLM, de ffmpeg e de sincronização de dados, e um pacote compartilhado do PostHog.',
              'Editor de vídeo: Construí o editor de vídeo e seu motor como um pacote do workspace, com transcrição Whisper, templates de legendas e telemetria de custo.',
              'Fechando o ciclo com usuários: Participei de calls com beta testers e percorri o onboarding na plataforma para ver onde os usuários tinham dificuldade, perguntei o que esperavam e os guiei para funcionalidades que cobriam o que diziam faltar. Também participei de calls duas vezes por semana com uma agência que usava a plataforma e transformei o feedback em correções e funcionalidades.',
            ],
          },
          stack: ['TypeScript', 'Node.js', 'Next.js', 'LLM APIs', 'AI Agents', 'LangGraph', 'Vercel Eve', 'Langfuse', 'OpenTelemetry', 'Gemini', 'Whisper', 'Remotion', 'PostgreSQL', 'Prisma', 'BullMQ', 'Docker', 'Railway', 'Vercel', 'Stripe', 'Meta Marketing API', 'TikTok Ads API', 'PostHog', 'Grafana'],
        },
      ],
    },
    {
      company: 'Vendoo',
      location: 'Remote',
      url: 'https://vendoo.co/',
      backers: [{ name: 'Y Combinator', short: 'YC', detail: 'W22' }],
      blurb: {
        en: 'Multichannel Listing Tool and Inventory Management Software for online sellers.',
        pt: 'Ferramenta de listagem multicanal e software de gestão de estoque para vendedores online.',
      },
      roles: [
        {
          role: {
            en: 'Staff Software Engineer & Solutions Architect',
            pt: 'Staff Software Engineer & Solutions Architect',
          },
          startMonth: '2024-05',
          endMonth: '2026-05',
          bullets: {
            en: [
              'Cut Elasticsearch spend by 41%: Rebuilt an unbalanced Elasticsearch cluster (oversized shards, outdated version, no index lifecycle policies) and documented a roadmap for further savings.',
              'Scaled to 90k+ daily listings: Led the migration from a Node.js monolith to event-driven microservices on Kafka, reducing listing latency by 300ms, cutting failed marketplace syncs and speeding up new marketplace integrations.',
              'Halved new-engineer ramp-up (6 to 3 weeks): Launched internal Tech Talks (10+ sessions) and a structured 1:1 mentorship framework to close system knowledge gaps.',
              'Faster, lighter releases: Re-engineered build and deployment pipelines (GitHub Actions, CircleCI), shrinking Docker images by 70% (1 GB to 300 MB) and shortening deployment cycles.',
              'Infrastructure ownership: Owned GCP/Kubernetes infrastructure via Terraform and Helm (cluster provisioning, service mesh, environment promotion) and built the observability stack that caught performance bottlenecks before they reached users.',
              'Learning from users directly: Joined customer success calls to understand user issues, then collected metrics and logs in real time to diagnose and fix them.',
            ],
            pt: [
              'Redução de 41% no custo do Elasticsearch: Reestruturei um cluster Elasticsearch desbalanceado (shards superdimensionados, versão desatualizada, sem políticas de ciclo de vida de índices) e documentei um roadmap para economias adicionais.',
              'Escala para mais de 90 mil anúncios diários: Liderei a migração de um monolito Node.js para microsserviços orientados a eventos com Kafka, reduzindo a latência de listagem em 300ms, diminuindo falhas de sincronização com marketplaces e acelerando novas integrações.',
              'Ramp-up de novos engenheiros pela metade (de 6 para 3 semanas): Criei Tech Talks internos (mais de 10 sessões) e um framework estruturado de mentoria 1:1 para fechar lacunas de conhecimento do sistema.',
              'Releases mais rápidos e leves: Reestruturei os pipelines de build e deploy (GitHub Actions, CircleCI), reduzindo as imagens Docker em 70% (de 1 GB para 300 MB) e encurtando os ciclos de deploy.',
              'Responsável pela infraestrutura: Gerenciei a infraestrutura GCP/Kubernetes via Terraform e Helm (provisionamento de clusters, service mesh, promoção entre ambientes) e construí a stack de observabilidade que detectava gargalos de desempenho antes de afetarem usuários.',
              'Aprendendo direto com usuários: Participei de calls com o time de customer success para entender os problemas dos usuários e coletei métricas e logs em tempo real para diagnosticá-los e corrigi-los.',
            ],
          },
          stack: ['React', 'Node.js', 'TypeScript', 'Kafka', 'PostgreSQL', 'GCP', 'BigQuery', 'Elasticsearch', 'Terraform', 'Docker', 'Kubernetes', 'Helm', 'CircleCI', 'GitHub Actions'],
        },
        {
          role: {
            en: 'Senior Software Engineer & Tech Lead',
            pt: 'Senior Software Engineer & Tech Lead',
          },
          startMonth: '2023-06',
          endMonth: '2024-04',
          bullets: {
            en: [
              "Found the cause of low signup rates: Led the investigation and found that referral campaigns sent users straight to a signup page with no information about Vendoo or its features. The growth team's A/B test confirmed that users landing on a custom page converted at a higher rate.",
              'Fixed subscription billing integrity: Found and fixed a bug that kept 1% of paying users marked as active after they had cancelled, restoring accurate subscription and revenue data.',
              'Led a team of up to 5 engineers: Designed, built and shipped backend services end-to-end, aligning technical decisions with product and business goals.',
              'Stable, predictable releases: Owned release cycles and CI/CD (CircleCI), enforcing test coverage gates and automated deployments.',
              'Technical Design: Drove data model and API design decisions, set coding standards and unblocked engineers on complex backend work.',
              'Stakeholder Coordination: Worked with product and business stakeholders to scope sprints, define acceptance criteria and align engineering effort with company strategy.',
            ],
            pt: [
              'Causa da baixa taxa de cadastro: Liderei a investigação e descobri que as campanhas de indicação levavam os usuários direto para uma página de cadastro sem nenhuma informação sobre a Vendoo ou suas funcionalidades. O teste A/B do time de growth confirmou que usuários que chegavam a uma página personalizada convertiam mais.',
              'Integridade das assinaturas: Encontrei e corrigi um bug que mantinha 1% dos usuários pagantes como ativos após o cancelamento, restaurando a precisão dos dados de assinatura e receita.',
              'Liderança de um time de até 5 engenheiros: Projetei, construí e entreguei serviços backend de ponta a ponta, alinhando decisões técnicas aos objetivos de produto e negócio.',
              'Releases estáveis e previsíveis: Fui responsável pelos ciclos de release e CI/CD (CircleCI), com gates de cobertura de testes e deploys automatizados.',
              'Design Técnico: Conduzi decisões de modelagem de dados e design de APIs, defini padrões de código e desbloqueei engenheiros em tarefas backend complexas.',
              'Coordenação com Stakeholders: Trabalhei com stakeholders de produto e negócio para definir o escopo das sprints, critérios de aceite e alinhar o esforço de engenharia à estratégia da empresa.',
            ],
          },
          stack: ['Node.js', 'TypeScript', 'PostgreSQL', 'CircleCI', 'Docker'],
        },
      ],
    },
    {
      company: 'Paerpay',
      location: 'Remote',
      url: 'https://paerpay.com/',
      backers: [{ name: 'Techstars' }],
      blurb: {
        en: 'Mobile payment integration platform for the restaurant industry.',
        pt: 'Plataforma de integração de pagamentos móveis para a indústria de restaurantes.',
      },
      roles: [
        {
          role: { en: 'Senior Software Engineer', pt: 'Senior Software Engineer' },
          startMonth: '2022-07',
          endMonth: '2023-05',
          bullets: {
            en: [
              'Cut partner support tickets by 30%+: Built a real-time transaction monitoring pipeline on BigQuery, giving partners instant visibility into payment statuses.',
              'Onboarded national restaurant chains: Designed adapters for multiple SOAP-based POS systems and REST payment gateways, unlocking integration with major national chains.',
              'Sub-second payments at peak: Scaled backend services on Firebase and GCP to handle high-throughput payment processing during peak hours.',
            ],
            pt: [
              'Redução de mais de 30% nos chamados de suporte: Construí um pipeline de monitoramento de transações em tempo real no BigQuery, dando aos parceiros visibilidade imediata do status dos pagamentos.',
              'Onboarding de redes nacionais de restaurantes: Projetei adaptadores para diversos sistemas POS baseados em SOAP e gateways de pagamento REST, viabilizando a integração com grandes redes nacionais.',
              'Pagamentos em menos de um segundo no pico: Escalei serviços backend em Firebase e GCP para processar grandes volumes de pagamentos em horários de pico.',
            ],
          },
          stack: ['React', 'Node.js', 'TypeScript', 'Firebase', 'GCP', 'BigQuery', 'Docker'],
        },
      ],
    },
    {
      company: 'EMB Software Engineering',
      location: 'Remote',
      url: 'https://www.linkedin.com/company/emb-software-engineering',
      blurb: {
        en: 'Software consultancy delivering cloud-native backends for data-heavy applications.',
        pt: 'Consultoria de software que entrega backends cloud-native para aplicações intensivas em dados.',
      },
      roles: [
        {
          role: { en: 'Senior Software Engineer & Architect', pt: 'Senior Software Engineer & Arquiteto' },
          startMonth: '2021-09',
          endMonth: '2022-04',
          bullets: {
            en: [
              'Repeatable client infrastructure: Owned end-to-end AWS deployment with Terraform (VPCs, ECS clusters, RDS, CDN), reused across multiple client projects.',
              'Shorter delivery cycles: Led API-First technical design, defining data models and interface contracts up front so teams could build in parallel and integrate with less friction.',
              'Technical Leadership: Managed the full backend lifecycle from specification to production, mentoring engineers and removing blockers across sprints.',
            ],
            pt: [
              'Infraestrutura replicável para clientes: Fui responsável pelo deploy completo na AWS com Terraform (VPCs, clusters ECS, RDS, CDN), reutilizado em diversos projetos de clientes.',
              'Ciclos de entrega mais curtos: Liderei o design técnico API-First, definindo modelos de dados e contratos de interface desde o início para que os times desenvolvessem em paralelo e integrassem com menos atrito.',
              'Liderança Técnica: Gerenciei todo o ciclo de vida do backend, da especificação à produção, mentorando engenheiros e removendo bloqueios ao longo das sprints.',
            ],
          },
          stack: ['Python', 'Django', 'React', 'Node.js', 'AWS', 'Docker', 'Sanity CMS', 'Shopify', 'Terraform', 'Redis', 'PostgreSQL'],
        },
      ],
    },
    {
      company: 'Citruslabs',
      location: 'Remote',
      url: 'https://www.citruslabs.io/',
      backers: [{ name: 'Techstars' }],
      blurb: {
        en: 'Clinical-trial recruitment platform connecting patients to research.',
        pt: 'Plataforma de recrutamento para ensaios clínicos conectando pacientes a pesquisas.',
      },
      roles: [
        {
          role: { en: 'Senior Software Engineer', pt: 'Senior Software Engineer' },
          startMonth: '2019-01',
          endMonth: '2021-09',
          bullets: {
            en: [
              'Cut customer onboarding from 2 weeks to 1 day (93%): Redesigned the MySQL data model so new trials and customers were set up through configuration instead of custom development.',
              'Lowered patient recruitment cost: Built automated funnel tracking pipelines (1,000+ responses per trial) that exposed a 10% drop-off, which drove funnel changes that reduced recruitment cost.',
              '70% faster time-to-market: Designed and implemented CI/CD workflows with GitHub Actions on AWS, increasing deployment frequency.',
            ],
            pt: [
              'Onboarding de clientes de 2 semanas para 1 dia (93%): Redesenhei o modelo de dados MySQL para que novos ensaios e clientes fossem configurados em vez de exigir desenvolvimento customizado.',
              'Menor custo de recrutamento de pacientes: Construí pipelines automatizados de tracking do funil (mais de 1.000 respostas por ensaio) que revelaram uma evasão de 10%, orientando mudanças no funil que reduziram o custo de recrutamento.',
              'Time-to-market 70% mais rápido: Projetei e implementei workflows de CI/CD com GitHub Actions na AWS, aumentando a frequência de deploys.',
            ],
          },
          stack: ['Python', 'Angular', 'Node.js', 'MySQL', 'AWS', 'Docker', 'GitHub Actions'],
        },
      ],
    },
    {
      company: 'Higglers',
      location: 'London, United Kingdom',
      blurb: {
        en: 'Very early-stage London startup. A SaaS platform for event organizers and traders: one place to create an event, find traders, negotiate and pay to be at the event.',
        pt: 'Startup londrina em estágio muito inicial. Uma plataforma SaaS para organizadores de eventos e expositores: um único lugar para criar um evento, encontrar expositores, negociar e pagar para participar do evento.',
      },
      roles: [
        {
          role: { en: 'Lead Software Engineer', pt: 'Lead Software Engineer' },
          startMonth: '2018-02',
          endMonth: '2018-09',
          bullets: {
            en: [
              'Re-designed the architecture: Led the redesign of the software architecture to meet evolving requirements and a new set of features.',
              'Led the engineering team: Guided and supported the team so tasks shipped on time and to a high standard.',
              'Wide ownership at a very early stage: Owned large parts of the product and reported directly to the CEO.',
              'Code reviews and new features: Reviewed code to catch flaws and bugs before they reached the project, and designed and built new features.',
            ],
            pt: [
              'Redesenho da arquitetura: Liderei o redesenho da arquitetura do software para atender a requisitos em evolução e a um novo conjunto de funcionalidades.',
              'Liderança do time de engenharia: Orientei e apoiei o time para que as tarefas fossem entregues no prazo e com alto padrão.',
              'Ampla autonomia em estágio inicial: Fui responsável por grandes partes do produto e reportava diretamente ao CEO.',
              'Code reviews e novas funcionalidades: Revisei código para encontrar falhas e bugs antes que afetassem o projeto, e projetei e construí novas funcionalidades.',
            ],
          },
          stack: ['Node.js', 'React', 'Redux', 'Docker', 'Heroku', 'AWS', 'CircleCI', 'Git', 'PostgreSQL'],
        },
      ],
    },
    {
      company: 'cloud.IQ',
      location: 'London, United Kingdom',
      backers: [{ name: 'PayPal' }],
      blurb: {
        en: 'London startup that uses AI to help online sellers increase sales. I worked on site in the London office.',
        pt: 'Startup de Londres que usa IA para ajudar vendedores online a aumentar as vendas. Trabalhei presencialmente no escritório de Londres.',
      },
      roles: [
        {
          role: { en: 'Software Engineer', pt: 'Software Engineer' },
          startMonth: '2016-10',
          endMonth: '2018-02',
          bullets: {
            en: [
              'From support to development: Started in the support team, learned the product and how clients configure it, then moved into the development team.',
              'Client self-service dashboard: Part of the team that designed and built a new dashboard so clients could handle their own configuration.',
              'Simpler setup for clients: Used what I learned in support to build a proof of concept for the new client portal that simplified the configuration process.',
              'MySQL and MongoDB at scale: Developed against MySQL tables with millions of rows and did data research for reports, plus MongoDB work. This was development and data research, not infrastructure.',
              'Hiring: Contributed to technical interviews to evaluate candidates.',
            ],
            pt: [
              'Do suporte ao desenvolvimento: Comecei no time de suporte, aprendi o produto e como os clientes o configuram, e depois passei para o time de desenvolvimento.',
              'Dashboard de autoatendimento para clientes: Fiz parte do time que projetou e construiu um novo dashboard para que os clientes cuidassem da própria configuração.',
              'Configuração mais simples para clientes: Usei o que aprendi no suporte para construir uma prova de conceito do novo portal do cliente que simplificava o processo de configuração.',
              'MySQL e MongoDB em volume: Desenvolvi sobre tabelas MySQL com milhões de linhas e fiz pesquisa de dados para relatórios, além de trabalhar com MongoDB. Foi desenvolvimento e pesquisa de dados, não infraestrutura.',
              'Contratação: Contribuí em entrevistas técnicas para avaliar candidatos.',
            ],
          },
          stack: ['Node.js', 'React', 'Redux', 'Apollo', 'GraphQL', 'Python', 'Docker', 'GCP', 'MySQL', 'MongoDB'],
        },
      ],
    },
    {
      company: 'Critical Software',
      location: 'Coimbra, Portugal',
      url: 'https://www.criticalsoftware.com/',
      blurb: {
        en: 'Software company in Coimbra, Portugal. I worked on a mission-critical project, MobiCS, a short-term car rental system, and on Certitools, a safety and security engineering management application.',
        pt: 'Empresa de software em Coimbra, Portugal. Trabalhei em um projeto de missão crítica, o MobiCS, um sistema de aluguel de carros por curto período, e no Certitools, uma aplicação de gestão de engenharia de segurança.',
      },
      roles: [
        {
          role: { en: 'Software Engineer', pt: 'Software Engineer' },
          startMonth: '2015-02',
          endMonth: '2016-08',
          bullets: {
            en: [
              'Mission-critical delivery: Gathered client feedback and designed features to meet their expectations on a mission-critical project.',
              'Payments and international invoicing: As MobiCS expanded to Latin America and European countries, refactored the existing payment and invoicing system to support international requirements on both the payment and the invoicing side.',
              'Revenue kept flowing: Built a custom standalone tool in Java on short notice, so the client could keep charging users while new payment providers were onboarded overseas. Ran it and delivered a results report to the client.',
              'PostgreSQL, SQL and PL/SQL: Wrote SQL and PL/SQL on PostgreSQL across both projects.',
              'Java EE 6 and 7: Built features and fixed issues in Java EE 6 and 7 applications using EJB, JPA/Hibernate, JMS and JBoss.',
              '24/7 on-call: Resolved production issues and was available for on-call support around the clock.',
              'Hiring: Worked with the recruitment team to evaluate programming tests for candidates.',
            ],
            pt: [
              'Entrega de missão crítica: Coletei feedback de clientes e projetei funcionalidades para atender às expectativas deles em um projeto de missão crítica.',
              'Pagamentos e faturas internacionais: Com a expansão do MobiCS para a América Latina e países europeus, refatorei o sistema de pagamentos e faturas existente para atender a requisitos internacionais tanto nos pagamentos quanto nas faturas.',
              'Receita garantida na expansão: Construí, em pouco tempo, uma ferramenta própria e independente em Java para que o cliente continuasse cobrando os usuários enquanto novos provedores de pagamento eram integrados no exterior. Eu a executava e entregava ao cliente um relatório com os resultados.',
              'PostgreSQL, SQL e PL/SQL: Escrevi SQL e PL/SQL em PostgreSQL nos dois projetos.',
              'Java EE 6 e 7: Construí funcionalidades e corrigi problemas em aplicações Java EE 6 e 7 com EJB, JPA/Hibernate, JMS e JBoss.',
              'Plantão 24/7: Resolvi problemas de produção e fiquei disponível para suporte em regime de plantão 24 horas.',
              'Contratação: Trabalhei com o time de recrutamento para avaliar testes de programação de candidatos.',
            ],
          },
          stack: ['Java', 'Java EE', 'EJB', 'JPA/Hibernate', 'JMS', 'JBoss', 'PostgreSQL', 'PL/SQL', 'SOAP', 'REST', 'Maven', 'Ant', 'JavaScript', 'jQuery'],
        },
      ],
    },
  ],
  education: [
    {
      institution: 'University of Coimbra',
      degree: { en: 'MSc in Software Engineering', pt: 'Mestrado em Engenharia de Software' },
      period: '2013 - ',
      location: 'Coimbra, Portugal',
      note: { en: 'Attended', pt: 'Cursado' },
    },
    {
      institution: 'University of Coimbra',
      degree: { en: 'BSc in Computer Science', pt: 'Bacharelado em Ciência da Computação' },
      period: '2009 - 2014',
      location: 'Coimbra, Portugal',
    },
  ],
  skills: [
    {
      label: { en: 'Programming', pt: 'Programação' },
      items: ['Python (Django, FastAPI)', 'JavaScript / TypeScript (Node.js, React)', 'Java', 'PHP', 'C'],
    },
    {
      label: { en: 'Cloud & Data', pt: 'Nuvem & Dados' },
      items: ['GCP', 'AWS', 'BigQuery', 'Kafka', 'Elasticsearch', 'Docker', 'Kubernetes', 'Terraform'],
    },
    {
      label: { en: 'Databases', pt: 'Bancos de Dados' },
      items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firestore'],
    },
    {
      label: { en: 'CI/CD', pt: 'CI/CD' },
      items: ['GitHub Actions', 'CircleCI', 'Jenkins'],
    },
  ],
  socialSkills: [
    {
      label: { en: 'Communication', pt: 'Comunicação' },
      description: {
        en: 'Bridging the gap between complex backend architecture and business metrics.',
        pt: 'Conectando arquitetura backend complexa a métricas de negócio.',
      },
    },
    {
      label: { en: 'Leadership', pt: 'Liderança' },
      description: {
        en: 'Led and mentored engineering teams, fostering high-scale engineering cultures.',
        pt: 'Liderei e mentorei times de engenharia, promovendo culturas de engenharia em alta escala.',
      },
    },
  ],
  languages: [
    {
      language: { en: 'Portuguese', pt: 'Português' },
      level: { en: 'Native', pt: 'Nativo' },
    },
    {
      language: { en: 'English', pt: 'Inglês' },
      level: { en: 'Professional proficiency', pt: 'Fluente profissional' },
      note: { en: 'Used in daily work communication.', pt: 'Usado diariamente no trabalho.' },
    },
    {
      language: { en: 'Spanish & French', pt: 'Espanhol & Francês' },
      level: { en: 'Basic proficiency', pt: 'Proficiência básica' },
      note: { en: 'Able to understand common phrases in professional settings.', pt: 'Capaz de entender frases comuns em contextos profissionais.' },
    },
  ],
  interests: {
    en: 'IoT problem solver and Arduino enthusiast; home brewing enthusiast.',
    pt: 'Entusiasta de IoT e Arduino; entusiasta de cerveja artesanal.',
  },
  pdf: {
    en: '/cv/EdmarBarros_CV.pdf',
    pt: '/cv/EdmarBarros_CV.pdf',
  },
};
