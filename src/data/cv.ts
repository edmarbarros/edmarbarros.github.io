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

export interface Company {
  company: string;
  location: string;
  url?: string;
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
      en: 'Staff Software Engineer & Solutions Architect',
      pt: 'Staff Software Engineer & Solutions Architect',
    },
    location: { en: 'Brazil · Remote', pt: 'Brasil · Remoto' },
    email: 'hello@edmarbarros.com',
    linkedin: 'https://linkedin.com/in/edmarbarros/',
    github: 'https://github.com/edmarbarros',
    photo: '/images/edmar.jpg',
  },
  summary: {
    en: 'Senior Software Engineer with over 10 years of experience building scalable, data-heavy production systems. Proven track record in driving business impact through architectural refactoring (Monolith to Microservices), infrastructure cost optimization (-45%), and radical process automation (over 90% reduction in onboarding time).',
    pt: 'Engenheiro de Software Sênior com mais de 10 anos de experiência construindo sistemas escaláveis e intensivos em dados em produção. Histórico comprovado em impulsionar impacto de negócio através de refatoração arquitetural (Monolito para Microsserviços), otimização de custo de infraestrutura (-45%) e automação radical de processos (mais de 90% de redução no tempo de onboarding).',
  },
  quote: {
    en: 'The mind that opens to a new idea never returns to its original size.',
    pt: 'A mente que se abre a uma nova ideia jamais volta ao seu tamanho original.',
  },
  quoteAuthor: 'Albert Einstein',
  experience: [
    {
      company: 'Vendoo',
      location: 'Remote',
      url: 'https://vendoo.co/',
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
          endMonth: 'present',
          bullets: {
            en: [
              'Architecture Evolution: Leading the migration from a legacy monolith to an Event-Driven microservices architecture using Kafka, scaling the system to handle over 90k daily listings while reducing system latency by 300ms.',
              'Cost Optimization: Designed and executed an Elasticsearch improvement plan that reduced monthly infrastructure costs by 45%, with a roadmap for an additional 20% reduction.',
              'DevOps Efficiency: Optimized CI/CD pipelines via GitHub Actions and CircleCI, reducing Docker image sizes from over 1 GB to 300 MB (75% reduction), significantly accelerating deployment speed.',
              'Technical Leadership: Established internal "Tech Talks" and a structured 1:1 mentorship framework, successfully closing the system knowledge gap and accelerating peer career progression.',
              'System Reliability: Monitor system health and performance, proactively identifying and resolving potential issues before they impact users.',
            ],
            pt: [
              'Evolução Arquitetural: Liderando a migração de um monolito legado para uma arquitetura de microsserviços orientada a eventos usando Kafka, escalando o sistema para processar mais de 90 mil anúncios diários enquanto reduz a latência do sistema em 300ms.',
              'Otimização de Custo: Projetei e executei um plano de melhoria do Elasticsearch que reduziu os custos mensais de infraestrutura em 45%, com roadmap para mais 20% de redução.',
              'Eficiência DevOps: Otimizei pipelines de CI/CD via GitHub Actions e CircleCI, reduzindo o tamanho das imagens Docker de mais de 1 GB para 300 MB (75% de redução), acelerando significativamente a velocidade de deploy.',
              'Liderança Técnica: Estabeleci "Tech Talks" internos e um framework estruturado de mentoria 1:1, fechando com sucesso lacunas de conhecimento do sistema e acelerando o crescimento de pares na carreira.',
              'Confiabilidade do Sistema: Monitoro saúde e desempenho do sistema, identificando e resolvendo proativamente problemas potenciais antes de impactar usuários.',
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
              'Squad Leadership: Led the engineering team in planning, development, and delivery of new features, ensuring alignment with business objectives and product goals.',
              'Agile Ownership: Worked closely with the product team to define the scope of sprints, establish priorities, and develop clear acceptance criteria for tasks.',
              'Release Management: Managed complex release cycles and CI/CD pipelines via CircleCI, ensuring that all updates were tested and delivered on time while maintaining system stability.',
              'Technical Support: Provided hands-on support to the engineering team to troubleshoot issues and remove blockers, ensuring consistent progress throughout the sprint.',
              'Collaboration: Coordinated cross-team collaboration to streamline workflows, improve communication, and promote a culture of shared responsibility.',
            ],
            pt: [
              'Liderança de Squad: Liderei o time de engenharia no planejamento, desenvolvimento e entrega de novas features, garantindo alinhamento com objetivos de negócio e metas de produto.',
              'Agile Ownership: Trabalhei próximo ao time de produto para definir o escopo de sprints, estabelecer prioridades e desenvolver critérios claros de aceite para as tarefas.',
              'Gestão de Releases: Gerenciei ciclos complexos de release e pipelines de CI/CD via CircleCI, garantindo que todas as atualizações fossem testadas e entregues no prazo mantendo estabilidade.',
              'Suporte Técnico: Dei suporte hands-on ao time de engenharia para resolver problemas e remover bloqueios, assegurando progresso consistente durante a sprint.',
              'Colaboração: Coordenei colaboração entre times para agilizar fluxos de trabalho, melhorar comunicação e promover uma cultura de responsabilidade compartilhada.',
            ],
          },
          stack: [],
        },
      ],
    },
    {
      company: 'Paerpay',
      location: 'Remote',
      url: 'https://paerpay.com/',
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
              'Operational Impact: Engineered a real-time transaction monitoring dashboard using BigQuery, providing partners instant visibility into payment statuses and drastically reducing support volume.',
              'Business Growth: Integrated diverse SOAP-based POS systems and REST payment gateways, enabling the onboarding of major national restaurant chains.',
              'Data Reliability: Scaled backend infrastructure using Firebase and GCP to ensure high-speed payment processing during peak hours.',
            ],
            pt: [
              'Impacto Operacional: Engenheirei um dashboard de monitoramento de transações em tempo real usando BigQuery, dando aos parceiros visibilidade imediata do status dos pagamentos e reduzindo drasticamente o volume de suporte.',
              'Crescimento de Negócio: Integrei diversos sistemas POS baseados em SOAP e gateways de pagamento REST, viabilizando o onboarding de grandes redes nacionais de restaurantes.',
              'Confiabilidade de Dados: Escalei a infraestrutura backend usando Firebase e GCP para garantir processamento de pagamentos de alta velocidade em horários de pico.',
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
        en: 'Software house focused on helping companies become digital effortlessly.',
        pt: 'Software house focada em ajudar empresas a se tornarem digitais sem esforço.',
      },
      roles: [
        {
          role: { en: 'Senior Software Engineer & Architect', pt: 'Senior Software Engineer & Arquiteto' },
          startMonth: '2021-09',
          endMonth: '2022-04',
          bullets: {
            en: [
              'Strategic Consulting: Lead digital transformations via an API-First approach, shortening the development lifecycle and improving integration efficiency.',
              'Hands-on Leadership: Manage the full software lifecycle from technical specification to cloud deployment (AWS/Terraform) for data-heavy applications.',
              'Technical Support: Provided hands-on support to the engineering team to troubleshoot issues and remove blockers, ensuring consistent progress throughout the sprint.',
              'Collaboration: Work with the product team to streamline workflows, define the product-development roadmap, and ensure alignment with business goals.',
            ],
            pt: [
              'Consultoria Estratégica: Lidero transformações digitais via uma abordagem API-First, encurtando o ciclo de desenvolvimento e melhorando a eficiência de integração.',
              'Liderança Hands-on: Gerencio o ciclo completo de software, desde a especificação técnica até o deploy em nuvem (AWS/Terraform), para aplicações intensivas em dados.',
              'Suporte Técnico: Forneci suporte hands-on ao time de engenharia para resolver problemas e remover bloqueios, garantindo progresso consistente durante a sprint.',
              'Colaboração: Trabalho com o time de produto para agilizar fluxos de trabalho, definir o roadmap de desenvolvimento do produto e assegurar alinhamento com objetivos de negócio.',
            ],
          },
          stack: ['Python', 'Django', 'React', 'Node.js', 'AWS', 'Docker', 'Sanity CMS', 'Shopify', 'Terraform', 'Redis'],
        },
      ],
    },
    {
      company: 'Citruslabs',
      location: 'Remote',
      url: 'https://www.citruslabs.io/',
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
              'Process Transformation: Spearheaded a database-normalization initiative that slashed customer onboarding time from 2 weeks to 1 day (93% improvement).',
              'Data-Driven Insights: Implemented automated patient-funnel tracking (1,000+ responses/trial), identifying a 10% drop-off rate to optimize recruitment costs.',
              'Release Velocity: Implemented CI/CD via GitHub Actions, increasing deployment frequency and reducing time-to-market by 70%.',
            ],
            pt: [
              'Transformação de Processo: Conduzi uma iniciativa de normalização de banco de dados que reduziu o tempo de onboarding de clientes de 2 semanas para 1 dia (melhoria de 93%).',
              'Insights Orientados a Dados: Implementei tracking automatizado de funil de pacientes (mais de 1.000 respostas por ensaio), identificando taxa de evasão de 10% para otimizar custos de recrutamento.',
              'Velocidade de Release: Implementei CI/CD via GitHub Actions, aumentando a frequência de deploy e reduzindo o time-to-market em 70%.',
            ],
          },
          stack: ['Python', 'Angular', 'Node.js', 'MySQL', 'AWS', 'Docker', 'GitHub Actions'],
        },
      ],
    },
  ],
  education: [
    {
      institution: 'University of Coimbra',
      degree: { en: 'MSc in Software Engineering', pt: 'Mestrado em Engenharia de Software' },
      period: '2013 – ',
      location: 'Coimbra, Portugal',
      note: { en: 'Attended', pt: 'Cursado' },
    },
    {
      institution: 'University of Coimbra',
      degree: { en: 'BSc in Computer Science', pt: 'Bacharelado em Ciência da Computação' },
      period: '2009 – 2014',
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
