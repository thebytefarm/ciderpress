import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createPaths } from './paths'
import { resolveTemplates, toTemplateSelectOptions } from './templates'

// oxlint-disable-next-line functional/no-let -- per-test temp dir, reassigned in beforeEach
let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ciderpress-templates-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

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
    write('bad.md', '---\nhint: x\n---\n# {{title}}\n')
    const { registry, issues } = await resolveTemplates({
      templates: [dir],
      paths: createPaths(dir),
    })
    expect(registry.has('bad')).toBe(false)
    expect(issues.some((issue) => issue.type === 'missing_field')).toBe(true)
  })

  it('should register a template that uses undeclared {{ }} markers', async () => {
    write('note.md', '---\nlabel: Note\nhint: x\n---\n# {{title}}\n\n{{ decision }} and {{ }}\n')
    const { registry, issues } = await resolveTemplates({
      templates: [dir],
      paths: createPaths(dir),
    })
    expect(registry.has('note')).toBe(true)
    expect(issues).toStrictEqual([])
  })

  it('should report an unreadable templates directory as an issue', async () => {
    const { issues } = await resolveTemplates({
      templates: ['does-not-exist'],
      paths: createPaths(dir),
    })
    expect(issues.some((issue) => issue.type === 'read_error')).toBe(true)
  })

  it('should discover templates nested in sub-directories and tag their group', async () => {
    writeIn('guides', 'ui.md', '---\nlabel: UI\nhint: UI guide\n---\n# {{title}}\n')
    const { registry, issues } = await resolveTemplates({
      templates: [dir],
      paths: createPaths(dir),
    })
    expect(issues).toStrictEqual([])
    expect(registry.get('ui')).toMatchObject({ group: 'guides' })
  })
})

describe('toTemplateSelectOptions()', () => {
  it('should return flat, unprefixed labels when only built-ins exist', async () => {
    const { resolved } = await resolveTemplates({ templates: undefined, paths: createPaths(dir) })
    const options = toTemplateSelectOptions(resolved)
    expect(options.length).toBeGreaterThan(0)
    expect(options.some((option) => option.value === 'guide')).toBe(true)
    expect(options.every((option) => !option.label.includes('/'))).toBe(true)
  })

  it('should carry each option as a value/label/hint row', async () => {
    const { resolved } = await resolveTemplates({ templates: undefined, paths: createPaths(dir) })
    const [option] = toTemplateSelectOptions(resolved)
    expect(option).toMatchObject({
      value: expect.any(String),
      label: expect.any(String),
      hint: expect.any(String),
    })
  })

  it('should leave a root-level custom template unprefixed', async () => {
    write('adr.md', '---\nlabel: ADR\nhint: Decision\n---\n# {{title}}\n')
    const { resolved } = await resolveTemplates({ templates: [dir], paths: createPaths(dir) })
    const options = toTemplateSelectOptions(resolved)
    expect(options.find((option) => option.value === 'adr')).toMatchObject({ label: 'ADR' })
  })

  it('should prefix a sub-directory template with its folder group', async () => {
    writeIn('guides', 'ui.md', '---\nlabel: UI\nhint: UI guide\n---\n# {{title}}\n')
    const { resolved } = await resolveTemplates({ templates: [dir], paths: createPaths(dir) })
    const options = toTemplateSelectOptions(resolved)
    expect(options.find((option) => option.value === 'ui')).toMatchObject({ label: 'guides/UI' })
  })

  it('should let a frontmatter group override the directory-derived group', async () => {
    writeIn('guides', 'api.md', '---\nlabel: API\nhint: API doc\ngroup: foobar\n---\n# {{title}}\n')
    const { resolved } = await resolveTemplates({ templates: [dir], paths: createPaths(dir) })
    const options = toTemplateSelectOptions(resolved)
    expect(options.find((option) => option.value === 'api')).toMatchObject({ label: 'foobar/API' })
  })
})

/**
 * Write a template file into the current temp dir.
 *
 * @private
 * @param name - File name (with extension)
 * @param body - Full file contents
 */
function write(name: string, body: string): void {
  writeFileSync(join(dir, name), body, 'utf8')
}

/**
 * Write a template file into a sub-directory of the current temp dir.
 *
 * @private
 * @param subdir - Sub-directory (relative to the temp dir), created if needed
 * @param name - File name (with extension)
 * @param body - Full file contents
 */
function writeIn(subdir: string, name: string, body: string): void {
  mkdirSync(join(dir, subdir), { recursive: true })
  writeFileSync(join(dir, subdir, name), body, 'utf8')
}
