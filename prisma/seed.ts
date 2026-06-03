import { PrismaClient, UserRole, SubscriptionTier, JobType, WorkMode, JobStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config as loadEnv } from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

// Load environment variables (seed runs outside Next.js context)
loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
loadEnv({ path: path.resolve(process.cwd(), '.env') })

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL must be set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding TalentAI.lk...')

  // ── Super Admin ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@talentai.lk' },
    update: {},
    create: {
      email: 'admin@talentai.lk',
      emailVerified: true,
      role: UserRole.super_admin,
      passwordHash: adminPassword,
    },
  })
  console.log('✓ Super admin:', admin.email)

  // ── Companies ────────────────────────────────────────────────────

  const company1 = await prisma.company.upsert({
    where: { slug: 'commercial-bank-of-ceylon' },
    update: {},
    create: {
      name: 'Commercial Bank of Ceylon',
      slug: 'commercial-bank-of-ceylon',
      description: "Sri Lanka's leading private bank, building digital banking platforms used by millions.",
      industry: 'Banking & Finance',
      companySize: 'size_500_plus',
      foundedYear: 1920,
      website: 'https://www.combank.lk',
      headquarters: 'Colombo 03, Sri Lanka',
      isVerified: true,
      subscriptionTier: SubscriptionTier.growth,
      subscriptionStatus: 'active',
      createdBy: admin.id,
      onboardedAt: new Date(),
    },
  })

  const company2 = await prisma.company.upsert({
    where: { slug: 'wso2' },
    update: {},
    create: {
      name: 'WSO2',
      slug: 'wso2',
      description: 'Global open-source technology company building API management, integration, and identity platforms trusted by enterprises worldwide.',
      industry: 'Software & Technology',
      companySize: 'size_201_500',
      foundedYear: 2005,
      website: 'https://wso2.com',
      headquarters: 'Colombo 03, Sri Lanka',
      isVerified: true,
      subscriptionTier: SubscriptionTier.enterprise,
      subscriptionStatus: 'active',
      createdBy: admin.id,
      onboardedAt: new Date(),
    },
  })

  const company3 = await prisma.company.upsert({
    where: { slug: 'dialog-axiata' },
    update: {},
    create: {
      name: 'Dialog Axiata',
      slug: 'dialog-axiata',
      description: "Sri Lanka's largest mobile network operator, driving digital transformation across telecommunications and fintech.",
      industry: 'Telecommunications',
      companySize: 'size_500_plus',
      foundedYear: 1995,
      website: 'https://www.dialog.lk',
      headquarters: 'Colombo 03, Sri Lanka',
      isVerified: true,
      subscriptionTier: SubscriptionTier.growth,
      subscriptionStatus: 'active',
      createdBy: admin.id,
      onboardedAt: new Date(),
    },
  })

  const company4 = await prisma.company.upsert({
    where: { slug: 'hsenid-business-solutions' },
    update: {},
    create: {
      name: 'hSenid Business Solutions',
      slug: 'hsenid-business-solutions',
      description: 'Award-winning HR tech company delivering cloud-based human capital management software to 1,500+ clients across 30 countries.',
      industry: 'HR Technology',
      companySize: 'size_51_200',
      foundedYear: 1997,
      website: 'https://hsenid.com',
      headquarters: 'Colombo 10, Sri Lanka',
      isVerified: true,
      subscriptionTier: SubscriptionTier.growth,
      subscriptionStatus: 'active',
      createdBy: admin.id,
      onboardedAt: new Date(),
    },
  })

  const company5 = await prisma.company.upsert({
    where: { slug: 'calcey-technologies' },
    update: {},
    create: {
      name: 'Calcey Technologies',
      slug: 'calcey-technologies',
      description: 'Product engineering company specialising in building scalable SaaS products for US and European startups.',
      industry: 'Software & Technology',
      companySize: 'size_51_200',
      foundedYear: 2009,
      website: 'https://calcey.com',
      headquarters: 'Colombo 05, Sri Lanka',
      isVerified: false,
      subscriptionTier: SubscriptionTier.growth,
      subscriptionStatus: 'active',
      createdBy: admin.id,
      onboardedAt: new Date(),
    },
  })

  console.log('✓ 5 companies seeded')

  // ── Employer Users ───────────────────────────────────────────────

  const empPassword = await bcrypt.hash('employer123!', 12)

  const employer1 = await prisma.user.upsert({
    where: { email: 'saman@combank.lk' },
    update: {},
    create: { email: 'saman@combank.lk', emailVerified: true, role: UserRole.employer_admin, passwordHash: empPassword },
  })
  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company1.id, userId: employer1.id } },
    update: {},
    create: { companyId: company1.id, userId: employer1.id, role: 'admin', acceptedAt: new Date() },
  })

  const employer2 = await prisma.user.upsert({
    where: { email: 'hr@wso2.com' },
    update: {},
    create: { email: 'hr@wso2.com', emailVerified: true, role: UserRole.employer_admin, passwordHash: empPassword },
  })
  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company2.id, userId: employer2.id } },
    update: {},
    create: { companyId: company2.id, userId: employer2.id, role: 'admin', acceptedAt: new Date() },
  })

  console.log('✓ Employer users seeded')

  // ── Job Seeker ───────────────────────────────────────────────────

  const seekerPassword = await bcrypt.hash('seeker123!', 12)
  const seeker = await prisma.user.upsert({
    where: { email: 'nishani@gmail.com' },
    update: {},
    create: { email: 'nishani@gmail.com', emailVerified: true, role: UserRole.job_seeker, passwordHash: seekerPassword },
  })
  await prisma.seekerProfile.upsert({
    where: { userId: seeker.id },
    update: {},
    create: {
      userId: seeker.id,
      fullName: 'Nishani Karunarathne',
      headline: 'Senior Software Engineer · Payments & Fintech',
      summary: 'Senior software engineer with 6 years building high-throughput payment systems.',
      location: 'Colombo, Sri Lanka',
      availability: 'immediately',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
      aiProfileScore: 72,
      isPublic: true,
    },
  })

  console.log('✓ Job seeker seeded')

  // ── Job Listings ─────────────────────────────────────────────────

  const jobs = [
    // Commercial Bank — 3 jobs
    {
      companyId: company1.id,
      postedBy: employer1.id,
      title: 'Senior Software Engineer — Payments Platform',
      slug: 'senior-software-engineer-payments-cbc-2026',
      description: `## About the role\n\nCommercial Bank of Ceylon is modernising its payments infrastructure and seeking a Senior Software Engineer to lead design and delivery of high-throughput, fault-tolerant payment processing services.\n\n## Key responsibilities\n\n- Design and build scalable REST and event-driven APIs for the payments platform\n- Lead code reviews and mentor 2–3 junior engineers\n- Optimise PostgreSQL queries for high-throughput workloads\n- Implement CI/CD pipelines and maintain 99.99% uptime SLAs`,
      requirements: ['5+ years software engineering', 'Strong Node.js and TypeScript', 'PostgreSQL expertise', 'Experience with payment systems'],
      responsibilities: ['Build scalable payment APIs', 'Lead code reviews', 'Mentor junior engineers'],
      skillsRequired: ['Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs'],
      skillsPreferred: ['AWS', 'Redis', 'Kubernetes'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 03, Sri Lanka',
      salaryMin: 180000, salaryMax: 240000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 5, experienceMax: 8,
      educationLevel: "Bachelor's in Computer Science or related",
      status: JobStatus.active,
      viewsCount: 234, applicationsCount: 47,
    },
    {
      companyId: company1.id,
      postedBy: employer1.id,
      title: 'Data Analyst — Retail Banking',
      slug: 'data-analyst-retail-banking-cbc-2026',
      description: `## About the role\n\nJoin our data team to extract insights from transaction data that drive product decisions for 4 million customers.\n\n## Responsibilities\n\n- Build dashboards and reports in Power BI and Tableau\n- Write complex SQL queries against our data warehouse\n- Partner with product managers on A/B test design and analysis\n- Present findings to senior leadership monthly`,
      requirements: ['3+ years data analysis', 'Strong SQL', 'Power BI or Tableau experience', 'Statistics background'],
      responsibilities: ['Build dashboards', 'Write SQL queries', 'Run A/B tests', 'Present insights'],
      skillsRequired: ['SQL', 'Power BI', 'Python', 'Data Analysis'],
      skillsPreferred: ['dbt', 'Snowflake', 'Tableau'],
      jobType: JobType.full_time,
      workMode: WorkMode.onsite,
      location: 'Colombo 03, Sri Lanka',
      salaryMin: 120000, salaryMax: 160000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 3, experienceMax: 5,
      educationLevel: "Bachelor's in Statistics, Mathematics or related",
      status: JobStatus.active,
      viewsCount: 189, applicationsCount: 31,
    },
    {
      companyId: company1.id,
      postedBy: employer1.id,
      title: 'Cybersecurity Analyst',
      slug: 'cybersecurity-analyst-cbc-2026',
      description: `## About the role\n\nProtect the bank's digital assets and customer data as part of our Security Operations Centre (SOC).\n\n## Key responsibilities\n\n- Monitor SIEM alerts and investigate potential security incidents\n- Conduct vulnerability assessments and penetration tests\n- Develop and maintain security policies and procedures\n- Respond to and document security incidents`,
      requirements: ['3+ years in cybersecurity', 'SIEM experience', 'CEH or CISSP certification preferred', 'Banking sector experience a plus'],
      responsibilities: ['Monitor SIEM', 'Conduct pen tests', 'Write security policies', 'Incident response'],
      skillsRequired: ['SIEM', 'Penetration Testing', 'Network Security', 'Linux'],
      skillsPreferred: ['CISSP', 'CEH', 'Splunk'],
      jobType: JobType.full_time,
      workMode: WorkMode.onsite,
      location: 'Colombo 03, Sri Lanka',
      salaryMin: 150000, salaryMax: 200000, salaryCurrency: 'LKR', salaryVisible: false,
      experienceMin: 3, experienceMax: 6,
      educationLevel: "Bachelor's in IT or Cybersecurity",
      status: JobStatus.active,
      viewsCount: 156, applicationsCount: 22,
    },

    // WSO2 — 3 jobs
    {
      companyId: company2.id,
      postedBy: employer2.id,
      title: 'Software Engineer — Ballerina Language',
      slug: 'software-engineer-ballerina-wso2-2026',
      description: `## About the role\n\nContribute to Ballerina, WSO2's open-source programming language designed for network-distributed applications, used by developers worldwide.\n\n## Responsibilities\n\n- Develop language features and standard library components in Java and Ballerina\n- Write and review technical documentation and specifications\n- Fix bugs and improve performance of the compiler and runtime\n- Mentor community contributors and review pull requests`,
      requirements: ['3+ years software engineering', 'Strong Java', 'Compiler/runtime internals experience', 'Open-source contribution history a plus'],
      responsibilities: ['Build language features', 'Write documentation', 'Fix compiler bugs', 'Mentor contributors'],
      skillsRequired: ['Java', 'Compilers', 'Distributed Systems', 'Open Source'],
      skillsPreferred: ['Go', 'Rust', 'GraalVM'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 03, Sri Lanka',
      salaryMin: 200000, salaryMax: 280000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 3, experienceMax: 7,
      educationLevel: "Bachelor's in Computer Science",
      status: JobStatus.active,
      viewsCount: 312, applicationsCount: 58,
    },
    {
      companyId: company2.id,
      postedBy: employer2.id,
      title: 'Senior DevOps Engineer',
      slug: 'senior-devops-engineer-wso2-2026',
      description: `## About the role\n\nOwn the cloud infrastructure and CI/CD systems that ship WSO2 products to thousands of enterprise customers.\n\n## Responsibilities\n\n- Design and operate Kubernetes clusters on AWS and Azure\n- Build and maintain CI/CD pipelines using GitHub Actions and Jenkins\n- Implement infrastructure-as-code with Terraform and Helm\n- Drive SRE practices: SLOs, error budgets, blameless postmortems`,
      requirements: ['5+ years DevOps/SRE', 'Kubernetes expertise', 'AWS or Azure certified', 'Terraform proficiency'],
      responsibilities: ['Manage Kubernetes clusters', 'Build CI/CD pipelines', 'Write Terraform modules', 'Run SRE practices'],
      skillsRequired: ['Kubernetes', 'AWS', 'Terraform', 'Docker', 'CI/CD'],
      skillsPreferred: ['Istio', 'ArgoCD', 'Prometheus'],
      jobType: JobType.full_time,
      workMode: WorkMode.remote,
      location: 'Remote — Sri Lanka',
      salaryMin: 220000, salaryMax: 300000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 5, experienceMax: 9,
      educationLevel: "Bachelor's in Computer Science or related",
      status: JobStatus.active,
      viewsCount: 445, applicationsCount: 71,
    },
    {
      companyId: company2.id,
      postedBy: employer2.id,
      title: 'Technical Writer — Developer Documentation',
      slug: 'technical-writer-docs-wso2-2026',
      description: `## About the role\n\nHelp developers around the world succeed with WSO2 products by creating clear, accurate, and engaging technical documentation.\n\n## Responsibilities\n\n- Write API references, tutorials, and conceptual guides\n- Work closely with engineers to document new features\n- Maintain and improve the docs.wso2.com site\n- Gather feedback from the developer community`,
      requirements: ['2+ years technical writing', 'Ability to understand and explain code', 'Docs-as-code workflow experience', 'Strong English writing skills'],
      responsibilities: ['Write API docs', 'Create tutorials', 'Maintain docs site', 'Community feedback'],
      skillsRequired: ['Technical Writing', 'Markdown', 'Git', 'API Documentation'],
      skillsPreferred: ['OpenAPI', 'Docusaurus', 'GraphQL'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 03, Sri Lanka',
      salaryMin: 100000, salaryMax: 140000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 2, experienceMax: 4,
      educationLevel: "Bachelor's in English, Computer Science or related",
      status: JobStatus.active,
      viewsCount: 98, applicationsCount: 14,
    },

    // Dialog — 2 jobs
    {
      companyId: company3.id,
      postedBy: employer1.id,
      title: 'Product Manager — Digital Financial Services',
      slug: 'product-manager-dfs-dialog-2026',
      description: `## About the role\n\nLead the product roadmap for Dialog's eZ Cash mobile wallet, used by over 5 million Sri Lankans.\n\n## Responsibilities\n\n- Define and prioritise the product roadmap with engineering and design\n- Conduct user research and competitive analysis\n- Define success metrics and monitor product KPIs\n- Collaborate with regulatory bodies on compliance requirements`,
      requirements: ['4+ years product management', 'Mobile payments or fintech experience', 'Data-driven decision making', 'Strong stakeholder management'],
      responsibilities: ['Define product roadmap', 'User research', 'Monitor KPIs', 'Regulatory compliance'],
      skillsRequired: ['Product Management', 'Fintech', 'Agile', 'Data Analysis'],
      skillsPreferred: ['Mobile Payments', 'SQL', 'Figma'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 03, Sri Lanka',
      salaryMin: 200000, salaryMax: 260000, salaryCurrency: 'LKR', salaryVisible: false,
      experienceMin: 4, experienceMax: 7,
      educationLevel: "Bachelor's in Business, Engineering or related",
      status: JobStatus.active,
      viewsCount: 267, applicationsCount: 39,
    },
    {
      companyId: company3.id,
      postedBy: employer1.id,
      title: 'Android Developer — Dialog TV+',
      slug: 'android-developer-dialog-tv-2026',
      description: `## About the role\n\nBuild the Android application for Dialog TV+, Sri Lanka's leading streaming platform with 2M+ subscribers.\n\n## Responsibilities\n\n- Develop features for the Dialog TV+ Android app (Kotlin)\n- Integrate video streaming SDKs and DRM solutions\n- Optimise performance across a wide range of Android devices\n- Work with QA and backend teams to ship bi-weekly releases`,
      requirements: ['3+ years Android development', 'Kotlin proficiency', 'ExoPlayer or similar video SDK experience', 'Strong understanding of Android architecture components'],
      responsibilities: ['Build Android features', 'Integrate streaming SDKs', 'Optimise performance', 'Ship bi-weekly releases'],
      skillsRequired: ['Kotlin', 'Android', 'ExoPlayer', 'MVVM'],
      skillsPreferred: ['Jetpack Compose', 'DRM', 'TV app development'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 03, Sri Lanka',
      salaryMin: 160000, salaryMax: 210000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 3, experienceMax: 6,
      educationLevel: "Bachelor's in Computer Science or related",
      status: JobStatus.active,
      viewsCount: 203, applicationsCount: 28,
    },

    // hSenid — 2 jobs
    {
      companyId: company4.id,
      postedBy: employer1.id,
      title: 'Full Stack Engineer — PeopleHR Platform',
      slug: 'fullstack-engineer-peoplehr-hsenid-2026',
      description: `## About the role\n\nJoin the team building PeopleHR, a cloud HR platform used by 1,500+ businesses across 30 countries.\n\n## Responsibilities\n\n- Build and maintain features across the React frontend and Java Spring Boot backend\n- Design database schemas and write efficient queries\n- Participate in architecture discussions and technical planning\n- Contribute to code quality through reviews and testing`,
      requirements: ['3+ years full-stack experience', 'React and Java', 'PostgreSQL or MySQL', 'REST API design'],
      responsibilities: ['Build features', 'Design database schemas', 'Code reviews', 'Technical planning'],
      skillsRequired: ['React', 'Java', 'Spring Boot', 'PostgreSQL', 'REST APIs'],
      skillsPreferred: ['AWS', 'Microservices', 'Docker'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 10, Sri Lanka',
      salaryMin: 140000, salaryMax: 190000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 3, experienceMax: 6,
      educationLevel: "Bachelor's in Computer Science or related",
      status: JobStatus.active,
      viewsCount: 178, applicationsCount: 33,
    },
    {
      companyId: company4.id,
      postedBy: employer1.id,
      title: 'UX Designer — HR Software',
      slug: 'ux-designer-hsenid-2026',
      description: `## About the role\n\nDesign intuitive experiences for HR professionals using our suite of workforce management tools.\n\n## Responsibilities\n\n- Conduct user research and usability testing\n- Create wireframes, prototypes, and high-fidelity mockups in Figma\n- Collaborate with engineers to ensure pixel-perfect implementation\n- Maintain and evolve our design system`,
      requirements: ['3+ years UX/product design', 'Figma proficiency', 'User research skills', 'SaaS B2B product experience'],
      responsibilities: ['User research', 'Create prototypes', 'Collaborate with engineers', 'Maintain design system'],
      skillsRequired: ['Figma', 'UX Research', 'Prototyping', 'Design Systems'],
      skillsPreferred: ['Motion Design', 'Accessibility', 'Storybook'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 10, Sri Lanka',
      salaryMin: 120000, salaryMax: 160000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 3, experienceMax: 5,
      educationLevel: "Bachelor's in Design, HCI or related",
      status: JobStatus.active,
      viewsCount: 134, applicationsCount: 19,
    },

    // Calcey — 2 jobs
    {
      companyId: company5.id,
      postedBy: employer1.id,
      title: 'React Native Engineer',
      slug: 'react-native-engineer-calcey-2026',
      description: `## About the role\n\nBuild cross-platform mobile apps for our US-based SaaS clients as part of a small, high-ownership product team.\n\n## Responsibilities\n\n- Develop and maintain React Native apps for iOS and Android\n- Collaborate directly with US-based clients and product owners\n- Integrate third-party APIs (Stripe, Twilio, Segment)\n- Write unit and integration tests`,
      requirements: ['2+ years React Native', 'Strong JavaScript/TypeScript', 'App Store and Play Store deployment experience', 'Good communication skills in English'],
      responsibilities: ['Build React Native apps', 'Client collaboration', 'API integrations', 'Write tests'],
      skillsRequired: ['React Native', 'TypeScript', 'iOS', 'Android'],
      skillsPreferred: ['Expo', 'Redux', 'GraphQL'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 05, Sri Lanka',
      salaryMin: 130000, salaryMax: 175000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 2, experienceMax: 5,
      educationLevel: "Bachelor's in Computer Science or related",
      status: JobStatus.active,
      viewsCount: 221, applicationsCount: 41,
    },
    {
      companyId: company5.id,
      postedBy: employer1.id,
      title: 'QA Engineer — Automation',
      slug: 'qa-engineer-automation-calcey-2026',
      description: `## About the role\n\nOwn quality for multiple SaaS products by building robust automated test suites and advocating for engineering excellence.\n\n## Responsibilities\n\n- Design and implement automated test frameworks (Playwright/Cypress)\n- Write and maintain API tests with Postman and REST Assured\n- Set up and maintain test pipelines in GitHub Actions\n- Define quality metrics and report test coverage`,
      requirements: ['2+ years QA automation', 'Playwright or Cypress', 'API testing experience', 'CI/CD knowledge'],
      responsibilities: ['Build test frameworks', 'API testing', 'Test pipelines', 'Quality metrics'],
      skillsRequired: ['Playwright', 'Cypress', 'API Testing', 'CI/CD', 'JavaScript'],
      skillsPreferred: ['Performance Testing', 'k6', 'BDD'],
      jobType: JobType.full_time,
      workMode: WorkMode.hybrid,
      location: 'Colombo 05, Sri Lanka',
      salaryMin: 110000, salaryMax: 150000, salaryCurrency: 'LKR', salaryVisible: true,
      experienceMin: 2, experienceMax: 4,
      educationLevel: "Bachelor's in Computer Science or related",
      status: JobStatus.active,
      viewsCount: 167, applicationsCount: 25,
    },
  ]

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { slug: job.slug },
      update: {},
      create: job,
    })
  }
  console.log(`✓ ${jobs.length} job listings seeded`)

  // ── Feature Flags ────────────────────────────────────────────────
  const flags = [
    { flagName: 'ai_jd_builder',         description: 'AI Job Description builder for employers',       enabledGlobally: true  },
    { flagName: 'ai_cv_screening',        description: 'Auto-screen applications with Claude',           enabledGlobally: true  },
    { flagName: 'talent_database_search', description: 'Employer talent database search (Growth+)',      enabledGlobally: false },
    { flagName: 'ai_interview_prep',      description: 'Interview prep coach for shortlisted seekers',   enabledGlobally: false },
    { flagName: 'ai_career_assistant',    description: 'Chat-based career coaching (Phase 2)',           enabledGlobally: false },
    { flagName: 'salary_benchmarking',    description: 'Anonymised salary benchmarks (Phase 2)',         enabledGlobally: false },
    { flagName: 'company_reviews',        description: 'Seeker reviews of employers (Phase 2)',          enabledGlobally: false },
  ]
  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { flagName: flag.flagName },
      update: {},
      create: { ...flag, enabledCompanyIds: [] },
    })
  }
  console.log('✓ Feature flags seeded')

  console.log('\n✅ Seed complete!')
  console.log('\nDemo credentials:')
  console.log('  Super Admin:  admin@talentai.lk    / admin123!')
  console.log('  Employer 1:   saman@combank.lk     / employer123!')
  console.log('  Employer 2:   hr@wso2.com          / employer123!')
  console.log('  Job Seeker:   nishani@gmail.com    / seeker123!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
