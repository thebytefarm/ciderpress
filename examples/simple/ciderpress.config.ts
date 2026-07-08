import { defineConfig } from 'ciderpress'

export default defineConfig({
  title: 'my-lib',
  description: 'A simple utility library',
  theme: { themes: ['grannysmith'] },
  templates: '.templates',
  home: {
    hero: {
      tagline: 'Lightweight utilities for everyday TypeScript.',
    },
  },
  pages: [
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
      discover: { sort: 'alpha' },
    },
  ],
  topbar: {
    nav: [
      { title: 'Getting Started', link: '/getting-started' },
      {
        title: 'Reference',
        items: [
          { title: 'API Reference', link: '/api-reference' },
          { title: 'Guides', link: '/guides' },
        ],
      },
    ],
  },
  footer: {
    message: 'Built with ciderpress',
    copyright: { company: 'my-lib' },
  },
})
