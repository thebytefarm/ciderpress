/**
 * Predefined technology tag to Iconify identifier + display label.
 *
 * Uses `devicon` as the primary source for colored icons, with `logos`,
 * `vscode-icons`, and `material-icon-theme` filling gaps. A small number
 * of entries fall back to `simple-icons` (monochrome) when no colored
 * alternative exists.
 *
 * Add new entries here when new technologies need card support.
 *
 * @example
 * ```ts
 * const { icon, label } = TECH_ICONS['typescript']
 * ```
 */
export const TECH_ICONS = {
  // -- Languages --
  typescript: { icon: 'devicon:typescript', label: 'TypeScript' },
  javascript: { icon: 'devicon:javascript', label: 'JavaScript' },
  python: { icon: 'devicon:python', label: 'Python' },
  go: { icon: 'devicon:go', label: 'Go' },
  rust: { icon: 'devicon:rust', label: 'Rust' },
  java: { icon: 'devicon:java', label: 'Java' },
  csharp: { icon: 'devicon:csharp', label: 'C#' },
  ruby: { icon: 'devicon:ruby', label: 'Ruby' },
  php: { icon: 'devicon:php', label: 'PHP' },
  swift: { icon: 'devicon:swift', label: 'Swift' },
  kotlin: { icon: 'devicon:kotlin', label: 'Kotlin' },
  elixir: { icon: 'devicon:elixir', label: 'Elixir' },
  dart: { icon: 'devicon:dart', label: 'Dart' },
  scala: { icon: 'devicon:scala', label: 'Scala' },
  c: { icon: 'devicon:c', label: 'C' },
  cplusplus: { icon: 'devicon:cplusplus', label: 'C++' },
  r: { icon: 'devicon:r', label: 'R' },
  lua: { icon: 'devicon:lua', label: 'Lua' },
  perl: { icon: 'devicon:perl', label: 'Perl' },
  haskell: { icon: 'devicon:haskell', label: 'Haskell' },
  clojure: { icon: 'devicon:clojure', label: 'Clojure' },
  erlang: { icon: 'devicon:erlang', label: 'Erlang' },
  fsharp: { icon: 'devicon:fsharp', label: 'F#' },
  julia: { icon: 'devicon:julia', label: 'Julia' },
  groovy: { icon: 'devicon:groovy', label: 'Groovy' },

  // -- Frontend frameworks --
  react: { icon: 'devicon:react', label: 'React' },
  nextjs: { icon: 'devicon:nextjs', label: 'Next.js' },
  vue: { icon: 'devicon:vuejs', label: 'Vue' },
  angular: { icon: 'devicon:angular', label: 'Angular' },
  svelte: { icon: 'devicon:svelte', label: 'Svelte' },
  astro: { icon: 'devicon:astro', label: 'Astro' },
  solid: { icon: 'devicon:solidjs', label: 'Solid' },
  remix: { icon: 'devicon:remix', label: 'Remix' },
  qwik: { icon: 'devicon:qwik', label: 'Qwik' },
  ember: { icon: 'devicon:ember', label: 'Ember' },
  gatsby: { icon: 'devicon:gatsby', label: 'Gatsby' },
  nuxtjs: { icon: 'devicon:nuxtjs', label: 'Nuxt' },
  preact: { icon: 'logos:preact', label: 'Preact' },
  lit: { icon: 'logos:lit', label: 'Lit' },

  // -- Backend frameworks --
  hono: { icon: 'logos:hono', label: 'Hono' },
  express: { icon: 'devicon:express', label: 'Express' },
  fastify: { icon: 'devicon:fastify', label: 'Fastify' },
  nestjs: { icon: 'devicon:nestjs', label: 'NestJS' },
  django: { icon: 'logos:django-icon', label: 'Django' },
  flask: { icon: 'devicon:flask', label: 'Flask' },
  rails: { icon: 'devicon:rails-wordmark', label: 'Rails' },
  spring: { icon: 'devicon:spring', label: 'Spring' },
  fastapi: { icon: 'devicon:fastapi', label: 'FastAPI' },
  laravel: { icon: 'devicon:laravel', label: 'Laravel' },
  phoenix: { icon: 'devicon:phoenix', label: 'Phoenix' },
  fiber: { icon: 'devicon:fiber', label: 'Fiber' },
  gin: { icon: 'logos:gin', label: 'Gin' },
  akka: { icon: 'devicon:akka', label: 'Akka' },

  // -- Mobile --
  flutter: { icon: 'devicon:flutter', label: 'Flutter' },
  reactnative: { icon: 'devicon:reactnative', label: 'React Native' },
  ionic: { icon: 'devicon:ionic', label: 'Ionic' },

  // -- Databases --
  postgresql: { icon: 'devicon:postgresql', label: 'PostgreSQL' },
  mysql: { icon: 'devicon:mysql', label: 'MySQL' },
  mongodb: { icon: 'devicon:mongodb', label: 'MongoDB' },
  redis: { icon: 'devicon:redis', label: 'Redis' },
  sqlite: { icon: 'devicon:sqlite', label: 'SQLite' },
  dynamodb: { icon: 'devicon:dynamodb', label: 'DynamoDB' },
  elasticsearch: { icon: 'devicon:elasticsearch', label: 'Elasticsearch' },
  neo4j: { icon: 'devicon:neo4j', label: 'Neo4j' },
  cassandra: { icon: 'devicon:cassandra', label: 'Cassandra' },
  couchdb: { icon: 'devicon:couchdb', label: 'CouchDB' },
  mariadb: { icon: 'devicon:mariadb', label: 'MariaDB' },
  influxdb: { icon: 'devicon:influxdb', label: 'InfluxDB' },
  cockroachdb: { icon: 'simple-icons:cockroachlabs', label: 'CockroachDB' },
  vitess: { icon: 'devicon:vitess', label: 'Vitess' },
  oracle: { icon: 'devicon:oracle', label: 'Oracle' },

  // -- ORM / Data tools --
  prisma: { icon: 'devicon:prisma', label: 'Prisma' },
  graphql: { icon: 'logos:graphql', label: 'GraphQL' },
  drizzle: { icon: 'logos:drizzle', label: 'Drizzle' },
  typeorm: { icon: 'logos:typeorm', label: 'TypeORM' },
  sequelize: { icon: 'logos:sequelize', label: 'Sequelize' },
  sqlalchemy: { icon: 'devicon:sqlalchemy', label: 'SQLAlchemy' },

  // -- Cloud & hosting --
  vercel: { icon: 'devicon:vercel', label: 'Vercel' },
  aws: { icon: 'devicon:amazonwebservices', label: 'AWS' },
  azure: { icon: 'devicon:azure', label: 'Azure' },
  gcp: { icon: 'devicon:googlecloud', label: 'GCP' },
  cloudflare: { icon: 'devicon:cloudflare', label: 'Cloudflare' },
  digitalocean: { icon: 'devicon:digitalocean', label: 'DigitalOcean' },
  heroku: { icon: 'devicon:heroku', label: 'Heroku' },
  netlify: { icon: 'devicon:netlify', label: 'Netlify' },
  firebase: { icon: 'devicon:firebase', label: 'Firebase' },
  supabase: { icon: 'devicon:supabase', label: 'Supabase' },
  railway: { icon: 'devicon:railway', label: 'Railway' },
  pulumi: { icon: 'devicon:pulumi', label: 'Pulumi' },
  fly: { icon: 'logos:fly-icon', label: 'Fly.io' },

  // -- CI/CD & DevOps --
  docker: { icon: 'devicon:docker', label: 'Docker' },
  kubernetes: { icon: 'devicon:kubernetes', label: 'Kubernetes' },
  github: { icon: 'devicon:github', label: 'GitHub' },
  'github-actions': { icon: 'devicon:githubactions', label: 'GitHub Actions' },
  gitlab: { icon: 'devicon:gitlab', label: 'GitLab' },
  circleci: { icon: 'logos:circleci', label: 'CircleCI' },
  terraform: { icon: 'devicon:terraform', label: 'Terraform' },
  ansible: { icon: 'devicon:ansible', label: 'Ansible' },
  jenkins: { icon: 'devicon:jenkins', label: 'Jenkins' },
  argocd: { icon: 'devicon:argocd', label: 'Argo CD' },

  // -- Build & package tools --
  vite: { icon: 'devicon:vite', label: 'Vite' },
  webpack: { icon: 'devicon:webpack', label: 'Webpack' },
  npm: { icon: 'devicon:npm', label: 'npm' },
  pnpm: { icon: 'devicon:pnpm', label: 'pnpm' },
  yarn: { icon: 'devicon:yarn', label: 'Yarn' },
  bun: { icon: 'devicon:bun', label: 'Bun' },
  eslint: { icon: 'devicon:eslint', label: 'ESLint' },
  babel: { icon: 'devicon:babel', label: 'Babel' },
  turborepo: { icon: 'logos:turborepo-icon', label: 'Turborepo' },
  biome: { icon: 'devicon:biome', label: 'Biome' },
  prettier: { icon: 'logos:prettier', label: 'Prettier' },
  esbuild: { icon: 'logos:esbuild', label: 'esbuild' },
  rollup: { icon: 'devicon:rollup', label: 'Rollup' },
  swc: { icon: 'logos:swc', label: 'SWC' },
  gradle: { icon: 'devicon:gradle', label: 'Gradle' },
  maven: { icon: 'devicon:maven', label: 'Maven' },

  // -- UI & styling --
  tailwindcss: { icon: 'devicon:tailwindcss', label: 'Tailwind CSS' },
  css: { icon: 'devicon:css3', label: 'CSS' },
  html: { icon: 'devicon:html5', label: 'HTML' },
  sass: { icon: 'devicon:sass', label: 'Sass' },
  bootstrap: { icon: 'devicon:bootstrap', label: 'Bootstrap' },
  materialui: { icon: 'devicon:materialui', label: 'Material UI' },
  'shadcn-ui': { icon: 'vscode-icons:file-type-shadcn', label: 'shadcn/ui' },
  storybook: { icon: 'devicon:storybook', label: 'Storybook' },
  figma: { icon: 'devicon:figma', label: 'Figma' },

  // -- Testing --
  jest: { icon: 'logos:jest', label: 'Jest' },
  vitest: { icon: 'devicon:vitest', label: 'Vitest' },
  cypress: { icon: 'devicon:cypressio', label: 'Cypress' },
  playwright: { icon: 'devicon:playwright', label: 'Playwright' },
  selenium: { icon: 'devicon:selenium', label: 'Selenium' },
  mocha: { icon: 'devicon:mocha', label: 'Mocha' },
  puppeteer: { icon: 'devicon:puppeteer', label: 'Puppeteer' },
  cucumber: { icon: 'logos:cucumber', label: 'Cucumber' },

  // -- Auth & integrations --
  oauth: { icon: 'devicon:oauth', label: 'OAuth' },
  auth0: { icon: 'logos:auth0', label: 'Auth0' },
  stripe: { icon: 'logos:stripe', label: 'Stripe' },
  twilio: { icon: 'devicon:twilio', label: 'Twilio' },

  // -- AI / ML --
  openai: { icon: 'logos:openai-icon', label: 'OpenAI' },
  tensorflow: { icon: 'devicon:tensorflow', label: 'TensorFlow' },
  pytorch: { icon: 'devicon:pytorch', label: 'PyTorch' },
  huggingface: { icon: 'devicon:huggingface', label: 'Hugging Face' },
  anthropic: { icon: 'logos:anthropic-icon', label: 'Anthropic' },
  jupyter: { icon: 'devicon:jupyter', label: 'Jupyter' },
  numpy: { icon: 'devicon:numpy', label: 'NumPy' },
  pandas: { icon: 'devicon:pandas', label: 'Pandas' },
  scikitlearn: { icon: 'devicon:scikitlearn', label: 'scikit-learn' },
  matplotlib: { icon: 'devicon:matplotlib', label: 'Matplotlib' },

  // -- Monitoring & observability --
  grafana: { icon: 'devicon:grafana', label: 'Grafana' },
  prometheus: { icon: 'devicon:prometheus', label: 'Prometheus' },
  datadog: { icon: 'devicon:datadog', label: 'Datadog' },
  sentry: { icon: 'devicon:sentry', label: 'Sentry' },
  newrelic: { icon: 'devicon:newrelic', label: 'New Relic' },

  // -- Message queues --
  kafka: { icon: 'devicon:apachekafka', label: 'Kafka' },
  rabbitmq: { icon: 'devicon:rabbitmq', label: 'RabbitMQ' },
  nats: { icon: 'devicon:nats', label: 'NATS' },

  // -- CMS --
  strapi: { icon: 'logos:strapi', label: 'Strapi' },
  contentful: { icon: 'logos:contentful', label: 'Contentful' },
  sanity: { icon: 'devicon:sanity', label: 'Sanity' },
  wordpress: { icon: 'devicon:wordpress', label: 'WordPress' },
  shopify: { icon: 'logos:shopify', label: 'Shopify' },
  ghost: { icon: 'devicon:ghost', label: 'Ghost' },

  // -- Infrastructure --
  node: { icon: 'devicon:nodejs', label: 'Node.js' },

  nginx: { icon: 'devicon:nginx', label: 'Nginx' },
  apache: { icon: 'devicon:apache', label: 'Apache' },
  linux: { icon: 'devicon:linux', label: 'Linux' },

  // -- Project-specific (label-only fallback when icon not in any set) --
  'trigger-dev': { icon: 'material-icon-theme:trigger', label: 'Trigger.dev' },
  'ai-sdk': { icon: 'simple-icons:vercel', label: 'AI SDK' },
  openrouter: { icon: 'simple-icons:openrouter', label: 'OpenRouter' },
  liquid: { icon: 'vscode-icons:file-type-liquid', label: 'Liquid' },
  zod: { icon: 'logos:zod', label: 'Zod' },
} as const satisfies Record<string, { readonly icon: string; readonly label: string }>

/**
 * Union of all supported technology tag names.
 */
export type TechName = keyof typeof TECH_ICONS
