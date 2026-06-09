import path from 'node:path'

import type { RspressPlugin } from '@rspress/core'
import type { MermaidConfig } from 'mermaid'
import { RemarkCodeBlockToGlobalComponentPluginFactory } from 'rspress-plugin-devkit'

// import.meta.dirname resolves to packages/ui/dist/ at runtime.
// Rslib copies the raw .tsx component into dist/plugins/mermaid/ so the
// path resolves correctly from the bundled output.
const distDir = import.meta.dirname
const componentPath = path.join(distDir, 'plugins', 'mermaid', 'MermaidRenderer.tsx')

interface MermaidPluginOptions {
  readonly mermaidConfig?: MermaidConfig
}

/**
 * Rspress plugin that renders mermaid code blocks as interactive SVG diagrams
 * with pan/zoom support and themed styling.
 *
 * @param options - Optional mermaid library configuration
 * @returns Rspress plugin object
 */
export function mermaidPlugin(options: MermaidPluginOptions = {}): RspressPlugin {
  const { mermaidConfig = {} } = options

  const remarkMermaid = new RemarkCodeBlockToGlobalComponentPluginFactory({
    components: [
      {
        lang: 'mermaid',
        componentPath,
        childrenProvider() {
          return []
        },
        propsProvider(code: string) {
          return {
            code,
            config: mermaidConfig,
          }
        },
      },
    ],
  })

  return {
    name: 'ciderpress-plugin-mermaid',
    markdown: {
      remarkPlugins: [remarkMermaid.remarkPlugin],
      globalComponents: remarkMermaid.mdxComponents,
    },
    builderConfig: remarkMermaid.builderConfig,
  }
}
