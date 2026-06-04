/**
 * Generate a large example project (~500 docs) modeled after
 * a real monorepo docs site (apps, packages, sections, guides).
 *
 * Run: node generate.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.dirname(new URL(import.meta.url).pathname)

const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum.',
]

function writeMd(filePath, title, extra = '') {
  const p = path.resolve(ROOT, filePath)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const para1 = LOREM[Math.abs(hashStr(title)) % LOREM.length]
  const para2 = LOREM[Math.abs(hashStr(title + '2')) % LOREM.length]
  fs.writeFileSync(
    p,
    `---
title: "${title}"
description: "Documentation for ${title}"
---

# ${title}

${para1}

## Overview

${para2}

## Configuration

\`\`\`ts
const config = {
  name: '${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}',
  enabled: true,
}
\`\`\`
${extra}
`
  )
}

function hashStr(s) {
  return s.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
}

const apps = [
  'api',
  'console',
  'tasks',
  'workers',
  'gateway',
  'scheduler',
  'notifications',
  'analytics',
]
apps.forEach((app) => {
  const topics = [
    'overview',
    'architecture',
    'configuration',
    'deployment',
    'testing',
    'monitoring',
    'troubleshooting',
    'authentication',
    'authorization',
    'rate-limiting',
    'caching',
    'logging',
    'error-handling',
    'middleware',
    'routing',
    'database',
    'migrations',
    'validation',
    'serialization',
    'health-checks',
  ]
  topics.forEach((topic) => {
    writeMd(`apps/${app}/docs/${topic}.md`, `${app} ${topic}`)
  })
})

const packages = [
  'database',
  'ai',
  'fp',
  'shell',
  'scout',
  'config',
  'auth',
  'cache',
  'logger',
  'queue',
]
packages.forEach((pkg) => {
  const topics = [
    'overview',
    'getting-started',
    'api-reference',
    'configuration',
    'testing',
    'patterns',
    'troubleshooting',
    'changelog',
    'migration-guide',
    'performance',
    'security',
    'types',
    'utilities',
    'examples',
    'contributing',
  ]
  topics.forEach((topic) => {
    writeMd(`libs/${pkg}/docs/${topic}.md`, `${pkg} ${topic}`)
  })
})

// Sections — guides, concepts, ai, development, security = ~250 docs
const sectionDocs = {
  'docs/guides': [
    'deployment',
    'local-dev',
    'ci-cd',
    'docker',
    'kubernetes',
    'monitoring',
    'alerts',
    'backups',
    'rollbacks',
    'feature-flags',
    'a-b-testing',
    'load-testing',
    'migrations',
    'database-ops',
    'cache-invalidation',
    'logging-guide',
    'debugging',
    'profiling',
    'security-scanning',
    'dependency-updates',
  ],
  'docs/concepts': [
    'authentication',
    'authorization',
    'data-model',
    'event-sourcing',
    'cqrs',
    'microservices',
    'api-gateway',
    'service-mesh',
    'circuit-breaker',
    'rate-limiting',
    'caching-strategies',
    'message-queues',
    'pub-sub',
    'saga-pattern',
    'outbox-pattern',
    'idempotency',
    'eventual-consistency',
    'sharding',
    'replication',
    'consensus',
  ],
  'docs/ai/best-practices': [
    'instructions',
    'rules',
    'settings',
    'skills',
    'agents',
    'prompting',
    'context-engineering',
    'evaluation',
    'fine-tuning',
    'safety',
  ],
  'docs/ai/coding-agents': [
    'claude-code',
    'cursor',
    'windsurf',
    'copilot',
    'cline',
    'aider',
    'codex',
    'gemini-cli',
    'augment',
    'zed',
  ],
  'docs/ai/concepts': [
    'agentic-patterns',
    'tool-use',
    'function-calling',
    'rag',
    'embeddings',
    'vector-search',
    'chain-of-thought',
    'tree-of-thought',
    'multi-agent',
    'human-in-loop',
  ],
  'docs/ai/ecosystem': [
    'mcp',
    'a2a',
    'agent-skills',
    'openai-api',
    'anthropic-api',
    'google-ai',
    'aws-bedrock',
    'azure-openai',
    'ollama',
    'vllm',
  ],
  'docs/development/standards': [
    'typescript',
    'testing',
    'documentation',
    'errors',
    'naming',
    'git-workflow',
    'code-review',
    'accessibility',
    'performance',
    'security',
  ],
  'docs/development/tools': [
    'pnpm',
    'turbo',
    'vitest',
    'playwright',
    'eslint',
    'prettier',
    'docker-compose',
    'terraform',
    'github-actions',
    'renovate',
  ],
  'docs/security': [
    'overview',
    'authentication',
    'secrets',
    'encryption',
    'compliance',
    'penetration-testing',
    'incident-response',
    'access-control',
    'audit-logging',
    'vulnerability-management',
  ],
  'docs/troubleshooting': [
    'api-errors',
    'build-failures',
    'deployment-issues',
    'database-problems',
    'performance-degradation',
    'auth-failures',
    'network-issues',
    'memory-leaks',
    'cpu-spikes',
    'disk-space',
  ],
}

Object.entries(sectionDocs).forEach(([dir, files]) => {
  files.forEach((file) => {
    const title = file.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    writeMd(`${dir}/${file}.md`, title)
  })
})

writeMd('docs/README.md', 'Introduction')
writeMd('docs/architecture.md', 'Architecture')
writeMd('docs/structure.md', 'Repository Structure')
writeMd('docs/commands.md', 'Commands')
writeMd('docs/ai/overview.md', 'AI Overview')
writeMd('docs/development/overview.md', 'Development Overview')
writeMd('contributing/README.md', 'Contributing')
writeMd('contributing/guides/pull-requests.md', 'Pull Requests')
writeMd('contributing/guides/code-style.md', 'Code Style')

let count = 0
function countMd(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  entries.forEach((e) => {
    if (e.isDirectory()) countMd(path.join(dir, e.name))
    else if (e.name.endsWith('.md')) count++
  })
}
countMd(ROOT)
console.log(`Generated ${count} markdown files`)
