import type { Bilingual } from './cv';

export type SkillGroup = 'languages' | 'cloud' | 'data' | 'practices';
export type SkillLevel = 'expert' | 'strong' | 'working';

export interface Skill {
  id: string;
  name: string;
  group: SkillGroup;
  /** Other words people use for it, so lookups and search find it. */
  aliases: string[];
  /**
   * Exact names in a role's tech list that count as use of this skill (case-insensitive).
   * Years and roles are computed from these, so they stay in step with the CV.
   */
  matches: string[];
  /**
   * Self-assessed level. Leave unset until confirmed: nothing here should claim more than is true.
   */
  level?: SkillLevel;
  /** Achievements that prove it. Only facts already on the CV or project pages. */
  proof: Bilingual[];
}

export const skillGroupLabels: Record<SkillGroup, Bilingual> = {
  languages: { en: 'Languages & frameworks', pt: 'Linguagens & frameworks' },
  cloud: { en: 'Cloud & infrastructure', pt: 'Nuvem & infraestrutura' },
  data: { en: 'Data & databases', pt: 'Dados & bancos de dados' },
  practices: { en: 'Practices & leadership', pt: 'Práticas & liderança' },
};

export const skillLevelLabels: Record<SkillLevel, Bilingual> = {
  expert: { en: 'Expert', pt: 'Especialista' },
  strong: { en: 'Strong', pt: 'Sólido' },
  working: { en: 'Working knowledge', pt: 'Conhecimento prático' },
};

export const skills: Skill[] = [
  // Data & databases
  {
    id: 'sql',
    name: 'SQL',
    group: 'data',
    aliases: ['relational databases', 'data modeling', 'queries', 'database'],
    matches: ['PostgreSQL', 'MySQL', 'BigQuery'],
    proof: [
      {
        en: 'Redesigned the MySQL data model at Citruslabs so new trials and customers were set up through configuration instead of custom development, cutting customer onboarding from 2 weeks to 1 day.',
        pt: 'Redesenhei o modelo de dados MySQL na Citruslabs para que novos ensaios e clientes fossem configurados em vez de exigir desenvolvimento customizado, reduzindo o onboarding de clientes de 2 semanas para 1 dia.',
      },
      {
        en: 'Built a real-time transaction monitoring pipeline on BigQuery at Paerpay, cutting partner support tickets by 30%+.',
        pt: 'Construí um pipeline de monitoramento de transações em tempo real no BigQuery na Paerpay, reduzindo em mais de 30% os chamados de suporte de parceiros.',
      },
      {
        en: 'Wrote SQL and PL/SQL on PostgreSQL at Critical Software, and research queries for reports over tables with millions of rows at cloud.IQ.',
        pt: 'Escrevi SQL e PL/SQL em PostgreSQL na Critical Software, e consultas de pesquisa para relatórios sobre tabelas com milhões de linhas na cloud.IQ.',
      },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    group: 'data',
    aliases: ['postgres', 'psql'],
    matches: ['PostgreSQL'],
    proof: [
      {
        en: 'Wrote SQL and PL/SQL on PostgreSQL across two Java EE projects at Critical Software.',
        pt: 'Escrevi SQL e PL/SQL em PostgreSQL em dois projetos Java EE na Critical Software.',
      },
    ],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    group: 'data',
    aliases: [],
    matches: ['MySQL'],
    proof: [
      {
        en: 'Redesigned the MySQL data model at Citruslabs so onboarding went from 2 weeks to 1 day.',
        pt: 'Redesenhei o modelo de dados MySQL na Citruslabs, levando o onboarding de 2 semanas para 1 dia.',
      },
      {
        en: 'Developed against MySQL tables with millions of rows and did data research for reports at cloud.IQ. This was development and data research, not infrastructure.',
        pt: 'Desenvolvi sobre tabelas MySQL com milhões de linhas e fiz pesquisa de dados para relatórios na cloud.IQ. Foi desenvolvimento e pesquisa de dados, não infraestrutura.',
      },
    ],
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    group: 'data',
    aliases: ['data warehouse', 'analytics'],
    matches: ['BigQuery'],
    proof: [
      {
        en: 'Built a real-time transaction monitoring pipeline at Paerpay, cutting partner support tickets by 30%+.',
        pt: 'Construí um pipeline de monitoramento de transações em tempo real na Paerpay, reduzindo em mais de 30% os chamados de suporte.',
      },
    ],
  },
  {
    id: 'kafka',
    name: 'Kafka',
    group: 'data',
    aliases: ['event-driven', 'event driven', 'streaming', 'messaging'],
    matches: ['Kafka'],
    proof: [
      {
        en: 'Led the migration from a Node.js monolith to event-driven microservices on Kafka at Vendoo, scaling to 90k+ daily listings, cutting listing latency by 300ms and speeding up new marketplace integrations.',
        pt: 'Liderei a migração de um monolito Node.js para microsserviços orientados a eventos com Kafka na Vendoo, escalando para mais de 90 mil anúncios diários, reduzindo a latência de listagem em 300ms e acelerando novas integrações com marketplaces.',
      },
    ],
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    group: 'data',
    aliases: ['elastic', 'search'],
    matches: ['Elasticsearch'],
    proof: [
      {
        en: 'Rebuilt an unbalanced Elasticsearch cluster at Vendoo (oversized shards, outdated version, no index lifecycle policies) and cut its cost by 41%.',
        pt: 'Reestruturei um cluster Elasticsearch desbalanceado na Vendoo (shards superdimensionados, versão desatualizada, sem políticas de ciclo de vida de índices) e reduzi seu custo em 41%.',
      },
    ],
  },
  {
    id: 'redis',
    name: 'Redis',
    group: 'data',
    aliases: ['cache', 'caching'],
    matches: ['Redis'],
    proof: [],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    group: 'data',
    aliases: ['nosql', 'document database'],
    matches: ['MongoDB'],
    proof: [],
  },
  // Cloud & infrastructure
  {
    id: 'gcp',
    name: 'GCP',
    group: 'cloud',
    aliases: ['google cloud', 'google cloud platform'],
    matches: ['GCP'],
    proof: [
      {
        en: 'Owned the GCP and Kubernetes infrastructure at Vendoo through Terraform and Helm: cluster provisioning, service mesh and environment promotion.',
        pt: 'Fui responsável pela infraestrutura GCP e Kubernetes na Vendoo via Terraform e Helm: provisionamento de clusters, service mesh e promoção entre ambientes.',
      },
      {
        en: 'Scaled backend services on Firebase and GCP at Paerpay to handle high-throughput payment processing during peak hours.',
        pt: 'Escalei serviços backend em Firebase e GCP na Paerpay para processar grandes volumes de pagamentos em horários de pico.',
      },
    ],
  },
  {
    id: 'aws',
    name: 'AWS',
    group: 'cloud',
    aliases: ['amazon web services', 'ecs', 'rds'],
    matches: ['AWS'],
    proof: [
      {
        en: 'Owned end-to-end AWS deployment with Terraform at EMB (VPCs, ECS clusters, RDS, CDN), reused across multiple client projects.',
        pt: 'Fui responsável pelo deploy completo na AWS com Terraform na EMB (VPCs, clusters ECS, RDS, CDN), reutilizado em diversos projetos de clientes.',
      },
      {
        en: 'Designed CI/CD workflows with GitHub Actions on AWS at Citruslabs, giving 70% faster time-to-market.',
        pt: 'Projetei workflows de CI/CD com GitHub Actions na AWS na Citruslabs, com time-to-market 70% mais rápido.',
      },
    ],
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    group: 'cloud',
    aliases: ['k8s', 'helm', 'containers', 'orchestration'],
    matches: ['Kubernetes', 'Helm'],
    proof: [
      {
        en: 'Owned the Kubernetes infrastructure at Vendoo through Terraform and Helm: cluster provisioning, service mesh and environment promotion.',
        pt: 'Fui responsável pela infraestrutura Kubernetes na Vendoo via Terraform e Helm: provisionamento de clusters, service mesh e promoção entre ambientes.',
      },
    ],
  },
  {
    id: 'terraform',
    name: 'Terraform',
    group: 'cloud',
    aliases: ['infrastructure as code', 'iac'],
    matches: ['Terraform'],
    proof: [
      {
        en: 'Built a reusable AWS deployment with Terraform at EMB and managed the GCP infrastructure with Terraform at Vendoo.',
        pt: 'Construí um deploy reutilizável na AWS com Terraform na EMB e gerenciei a infraestrutura GCP com Terraform na Vendoo.',
      },
    ],
  },
  {
    id: 'docker',
    name: 'Docker',
    group: 'cloud',
    aliases: ['containers', 'images'],
    matches: ['Docker'],
    proof: [
      {
        en: 'Shrank Docker images by 70% (1 GB to 300 MB) at Vendoo while reworking the build and deployment pipelines.',
        pt: 'Reduzi as imagens Docker em 70% (de 1 GB para 300 MB) na Vendoo ao reestruturar os pipelines de build e deploy.',
      },
    ],
  },
  {
    id: 'cicd',
    name: 'CI/CD',
    group: 'cloud',
    aliases: [
      'continuous integration',
      'continuous delivery',
      'pipelines',
      'github actions',
      'circleci',
      'jenkins',
      'deployment',
    ],
    matches: ['CircleCI', 'GitHub Actions'],
    proof: [
      {
        en: 'Re-engineered build and deployment pipelines at Vendoo (GitHub Actions, CircleCI), shortening deployment cycles.',
        pt: 'Reestruturei os pipelines de build e deploy na Vendoo (GitHub Actions, CircleCI), encurtando os ciclos de deploy.',
      },
      {
        en: 'Designed CI/CD with GitHub Actions on AWS at Citruslabs, giving 70% faster time-to-market.',
        pt: 'Projetei CI/CD com GitHub Actions na AWS na Citruslabs, com time-to-market 70% mais rápido.',
      },
    ],
  },
  // Languages & frameworks
  {
    id: 'typescript',
    name: 'TypeScript',
    group: 'languages',
    aliases: ['javascript', 'js', 'ts'],
    matches: ['TypeScript'],
    proof: [],
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    group: 'languages',
    aliases: ['node', 'nodejs', 'backend', 'javascript'],
    matches: ['Node.js'],
    proof: [],
  },
  {
    id: 'python',
    name: 'Python',
    group: 'languages',
    aliases: ['django', 'fastapi'],
    matches: ['Python', 'Django'],
    proof: [],
  },
  {
    id: 'react',
    name: 'React',
    group: 'languages',
    aliases: ['frontend', 'front-end'],
    matches: ['React'],
    proof: [],
  },
  {
    id: 'java',
    name: 'Java',
    group: 'languages',
    aliases: ['java ee', 'jee', 'ejb', 'jboss', 'hibernate', 'jpa'],
    matches: ['Java', 'Java EE'],
    proof: [
      {
        en: 'Built features and fixed issues in Java EE 6 and 7 applications at Critical Software, including MobiCS, a car rental platform with payment and invoice processing.',
        pt: 'Construí funcionalidades e corrigi problemas em aplicações Java EE 6 e 7 na Critical Software, incluindo o MobiCS, uma plataforma de aluguel de carros com pagamentos e faturas.',
      },
    ],
  },
  {
    id: 'php',
    name: 'PHP',
    group: 'languages',
    aliases: [],
    matches: [],
    proof: [],
  },
  {
    id: 'c',
    name: 'C',
    group: 'languages',
    aliases: [],
    matches: [],
    proof: [],
  },
  // Practices & leadership
  {
    id: 'architecture',
    name: 'Backend architecture',
    group: 'practices',
    aliases: [
      'system design',
      'microservices',
      'monolith',
      'api design',
      'solutions architect',
      'distributed systems',
    ],
    matches: [],
    proof: [
      {
        en: 'Led the migration from a Node.js monolith to event-driven microservices on Kafka at Vendoo, defining service boundaries, data models and API contracts.',
        pt: 'Liderei a migração de um monolito Node.js para microsserviços orientados a eventos com Kafka na Vendoo, definindo fronteiras de serviço, modelos de dados e contratos de API.',
      },
      {
        en: 'Led API-first technical design at EMB, defining data models and interface contracts up front so teams could build in parallel.',
        pt: 'Liderei o design técnico API-first na EMB, definindo modelos de dados e contratos de interface desde o início para que os times desenvolvessem em paralelo.',
      },
      {
        en: 'Designed a Port, Adapter, Registry and Host architecture at Quander to make new ad integrations cheaper to add. The design is done but has not been implemented.',
        pt: 'Desenhei uma arquitetura de Port, Adapter, Registry e Host na Quander para tornar novas integrações de anúncios mais baratas de adicionar. O desenho está pronto, mas não foi implementado.',
      },
      {
        en: 'Led the redesign of the software architecture at Higglers to meet evolving requirements and a new set of features.',
        pt: 'Liderei o redesenho da arquitetura do software na Higglers para atender a requisitos em evolução e a um novo conjunto de funcionalidades.',
      },
    ],
  },
  {
    id: 'leadership',
    name: 'Technical leadership',
    group: 'practices',
    aliases: ['tech lead', 'mentoring', 'mentorship', 'team lead', 'management'],
    matches: [],
    proof: [
      {
        en: 'Led a team of up to 5 engineers at Vendoo, owning release cycles, CI/CD quality gates and technical design.',
        pt: 'Liderei um time de até 5 engenheiros na Vendoo, responsável por ciclos de release, gates de qualidade de CI/CD e design técnico.',
      },
      {
        en: 'Halved new-engineer ramp-up from 6 to 3 weeks at Vendoo with 10+ internal Tech Talks and a structured 1:1 mentorship framework.',
        pt: 'Reduzi pela metade o ramp-up de novos engenheiros, de 6 para 3 semanas, na Vendoo, com mais de 10 Tech Talks internos e um framework estruturado de mentoria 1:1.',
      },
      {
        en: 'Led the engineering team at Higglers, a very early-stage startup, guiding the team and reviewing code, while reporting directly to the CEO.',
        pt: 'Liderei o time de engenharia na Higglers, uma startup em estágio muito inicial, orientando o time e revisando código, reportando diretamente ao CEO.',
      },
    ],
  },
  {
    id: 'observability',
    name: 'Observability',
    group: 'practices',
    aliases: ['monitoring', 'metrics', 'logging', 'tracing', 'dashboards'],
    matches: ['PostHog', 'Grafana'],
    proof: [
      {
        en: 'Built the observability stack at Vendoo that caught performance bottlenecks before they reached users.',
        pt: 'Construí a stack de observabilidade na Vendoo que detectava gargalos de desempenho antes de afetarem usuários.',
      },
      {
        en: 'Added PostHog session recording and feature flags plus Grafana metrics and dashboards at Quander.',
        pt: 'Adicionei gravação de sessões e feature flags com PostHog, além de métricas e dashboards no Grafana, na Quander.',
      },
    ],
  },
  {
    id: 'payments',
    name: 'Payments and billing',
    group: 'practices',
    aliases: ['stripe', 'subscriptions', 'billing', 'payment gateways', 'pos'],
    matches: ['Stripe'],
    proof: [
      {
        en: 'Built the full subscription and payment flow on Stripe at Quander, opening self-serve revenue where B2B customers had been billed manually.',
        pt: 'Construí todo o fluxo de assinatura e pagamento no Stripe na Quander, abrindo receita self-service onde clientes B2B eram cobrados manualmente.',
      },
      {
        en: 'Designed adapters for multiple SOAP-based POS systems and REST payment gateways at Paerpay, unlocking integration with major national restaurant chains.',
        pt: 'Projetei adaptadores para diversos sistemas POS baseados em SOAP e gateways de pagamento REST na Paerpay, viabilizando a integração com grandes redes nacionais de restaurantes.',
      },
      {
        en: 'Refactored the existing MobiCS payment and invoicing system at Critical Software to support international requirements as it expanded to Latin America and European countries, and built a standalone Java tool on short notice so the client could keep charging users while new payment providers were onboarded.',
        pt: 'Refatorei o sistema de pagamentos e faturas existente do MobiCS na Critical Software para atender a requisitos internacionais na expansão para a América Latina e países europeus, e construí em pouco tempo uma ferramenta independente em Java para que o cliente continuasse cobrando os usuários enquanto novos provedores de pagamento eram integrados.',
      },
    ],
  },
  {
    id: 'ai-agents',
    name: 'LLM and AI agents',
    group: 'practices',
    aliases: ['llm', 'ai', 'agents', 'agent skills', 'generative ai', 'machine learning'],
    matches: ['LLM APIs', 'AI Agents'],
    proof: [
      {
        en: "Added agent tools and skills at Quander that let the AI agent read and navigate a user's Meta ads performance data.",
        pt: 'Adicionei ferramentas e skills de agente na Quander que permitem ao agente de IA ler e navegar pelos dados de desempenho de anúncios da Meta de um usuário.',
      },
    ],
  },
];

// Evidence ---------------------------------------------------------------------

/**
 * How well the CV evidences a skill. This is a fact about the data, not a claim of
 * proficiency: it only measures how long and in how many roles a skill appears in the
 * tech lists. The self-assessed `level` stays separate.
 */
export type EvidenceTier = 'extensive' | 'solid' | 'limited' | 'achievements' | 'none';

export const EVIDENCE_RULE = {
  extensiveMinYears: 4,
  extensiveMinRoles: 3,
  solidMinYears: 2,
} as const;

export const evidenceLabels: Record<EvidenceTier, Bilingual> = {
  extensive: { en: 'Extensive evidence', pt: 'Evidência extensa' },
  solid: { en: 'Solid evidence', pt: 'Evidência sólida' },
  limited: { en: 'Limited evidence', pt: 'Evidência limitada' },
  achievements: { en: 'Shown through achievements', pt: 'Demonstrada por conquistas' },
  none: { en: 'No evidence attached yet', pt: 'Sem evidência associada ainda' },
};

export const evidenceRuleText: Bilingual = {
  en: `Evidence label: extensive means ${EVIDENCE_RULE.extensiveMinYears}+ years across ${EVIDENCE_RULE.extensiveMinRoles}+ roles, solid means ${EVIDENCE_RULE.solidMinYears}+ years, limited means less. It measures how long a skill appears in the tech lists, not depth, so achievements matter more than the label.`,
  pt: `Rótulo de evidência: extensa significa ${EVIDENCE_RULE.extensiveMinYears}+ anos em ${EVIDENCE_RULE.extensiveMinRoles}+ cargos, sólida significa ${EVIDENCE_RULE.solidMinYears}+ anos, limitada significa menos. Mede por quanto tempo a habilidade aparece nas listas de tecnologias, não a profundidade, então as conquistas valem mais que o rótulo.`,
};

export function evidenceTier(input: {
  years: number | null;
  roles: number;
  proofCount: number;
}): EvidenceTier {
  const { years, roles, proofCount } = input;
  if (years === null) return proofCount > 0 ? 'achievements' : 'none';
  if (years >= EVIDENCE_RULE.extensiveMinYears && roles >= EVIDENCE_RULE.extensiveMinRoles) {
    return 'extensive';
  }
  return years >= EVIDENCE_RULE.solidMinYears ? 'solid' : 'limited';
}
