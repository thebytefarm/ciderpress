import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'my-lib',
  description: 'A simple utility library',
  tagline: 'Lightweight utilities for everyday TypeScript.',
  sections: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      title: 'API Reference',
      path: '/api-reference',
      include: 'docs/api-reference.md',
      icon: 'pixelarticons:book-open',
    },
    {
      title: 'Guides',
      path: '/guides',
      include: 'docs/guides/*.md',
      icon: 'pixelarticons:article',
      sort: 'alpha',
    },
  ],
  nav: 'auto',
})
