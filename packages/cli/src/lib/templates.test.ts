import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createPaths } from './paths'
import { resolveTemplates } from './templates'

// oxlint-disable-next-line functional/no-let -- per-test temp dir, reassigned in beforeEach
let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ciderpress-templates-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

/**
 * Write a template file into the current temp dir.
 *
 * @param name - File name (with extension)
 * @param body - Full file contents
 */
function write(name: string, body: string): void {
  writeFileSync(join(dir, name), body, 'utf8')
}

describe('resolveTemplates()', () => {
  it('should return built-ins only when no templates are configured', async () => {
    const { registry, resolved, issues } = await resolveTemplates({
      templates: undefined,
      paths: createPaths(dir),
    })
    expect(issues).toStrictEqual([])
    expect(registry.has('guide')).toBe(true)
    expect(resolved.every((entry) => entry.source === 'built-in')).toBe(true)
  })

  it('should load a custom template from a directory', async () => {
    write('adr.md', '---\nlabel: ADR\nhint: Decision\n---\n# {{title}}\n')
    const { registry, resolved, issues } = await resolveTemplates({
      templates: [dir],
      paths: createPaths(dir),
    })
    expect(issues).toStrictEqual([])
    expect(registry.has('adr')).toBe(true)
    const adr = resolved.find((entry) => entry.template.type === 'adr')
    expect(adr).toMatchObject({ overridesBuiltIn: false })
    expect(adr).not.toMatchObject({ source: 'built-in' })
  })

  it('should let a custom template override a built-in of the same type', async () => {
    write('guide.md', '---\nlabel: Custom Guide\nhint: Ours\n---\n# {{title}}\n\ncustom body\n')
    const { registry, resolved } = await resolveTemplates({
      templates: [dir],
      paths: createPaths(dir),
    })
    expect(registry.get('guide')).toMatchObject({ body: expect.stringContaining('custom body') })
    const guide = resolved.find((entry) => entry.template.type === 'guide')
    expect(guide).toMatchObject({ overridesBuiltIn: true })
  })

  it('should preserve the .mdx extension on loaded templates', async () => {
    write('widget.mdx', '---\nlabel: Widget\nhint: JSX\n---\n# {{title}}\n')
    const { registry } = await resolveTemplates({ templates: [dir], paths: createPaths(dir) })
    expect(registry.get('widget')).toMatchObject({ extension: '.mdx' })
  })

  it('should report a duplicate type across extensions as an issue', async () => {
    write('note.md', '---\nlabel: Note\nhint: A\n---\n# {{title}}\n')
    write('note.mdx', '---\nlabel: Note\nhint: B\n---\n# {{title}}\n')
    const { registry, issues } = await resolveTemplates({
      templates: [dir],
      paths: createPaths(dir),
    })
    expect(registry.has('note')).toBe(true)
    expect(issues.some((issue) => issue.type === 'duplicate_type')).toBe(true)
  })

  it('should collect validation issues without registering the bad template', async () => {
    write('bad.md', '---\nlabel: Bad\nhint: x\n---\n# {{title}}\n\n{{oops}}\n')
    const { registry, issues } = await resolveTemplates({
      templates: [dir],
      paths: createPaths(dir),
    })
    expect(registry.has('bad')).toBe(false)
    expect(issues.some((issue) => issue.type === 'unknown_placeholder')).toBe(true)
  })

  it('should report an unreadable templates directory as an issue', async () => {
    const { issues } = await resolveTemplates({
      templates: ['does-not-exist'],
      paths: createPaths(dir),
    })
    expect(issues.some((issue) => issue.type === 'read_error')).toBe(true)
  })
})
