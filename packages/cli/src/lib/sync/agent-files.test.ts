import { describe, it, expect } from 'vitest'

import {
  AGENT_INSTRUCTION_FILES,
  excludeGlobbedAgentFiles,
  isAgentInstructionFile,
} from './agent-files'

describe('isAgentInstructionFile()', () => {
  it('should match known uppercase agent files', () => {
    expect(isAgentInstructionFile('CLAUDE.md')).toBe(true)
    expect(isAgentInstructionFile('AGENTS.md')).toBe(true)
  })

  it('should not match lowercase variants', () => {
    expect(isAgentInstructionFile('claude.md')).toBe(false)
    expect(isAgentInstructionFile('agents.md')).toBe(false)
  })

  it('should not match ordinary content files', () => {
    expect(isAgentInstructionFile('README.md')).toBe(false)
    expect(isAgentInstructionFile('guide.md')).toBe(false)
  })

  it('should keep the seed list stable', () => {
    expect(AGENT_INSTRUCTION_FILES).toContain('CLAUDE.md')
    expect(AGENT_INSTRUCTION_FILES).toContain('AGENTS.md')
  })
})

describe('excludeGlobbedAgentFiles()', () => {
  it('should drop agent files swept up by a glob', () => {
    const files = ['docs/intro.md', 'docs/CLAUDE.md', 'docs/api/AGENTS.md']
    expect(excludeGlobbedAgentFiles(files, ['docs/**/*.md'])).toEqual(['docs/intro.md'])
  })

  it('should keep agent files named by a literal (non-glob) include', () => {
    const files = ['docs/CLAUDE.md']
    expect(excludeGlobbedAgentFiles(files, ['docs/CLAUDE.md'])).toEqual(['docs/CLAUDE.md'])
  })

  it('should keep a literally-included agent file even when a glob is also present', () => {
    const files = ['docs/intro.md', 'docs/CLAUDE.md', 'docs/api/AGENTS.md']
    const result = excludeGlobbedAgentFiles(files, ['docs/**/*.md', 'docs/CLAUDE.md'])
    expect(result).toEqual(['docs/intro.md', 'docs/CLAUDE.md'])
  })

  it('should leave lowercase agent-like files untouched', () => {
    const files = ['docs/claude.md', 'docs/agents.md']
    expect(excludeGlobbedAgentFiles(files, ['docs/**/*.md'])).toEqual(files)
  })

  it('should normalize ./ and separator differences when matching literal includes', () => {
    const files = ['docs/CLAUDE.md']
    expect(excludeGlobbedAgentFiles(files, ['./docs/CLAUDE.md'])).toEqual(['docs/CLAUDE.md'])
  })

  it('should return content files unchanged when none are agent files', () => {
    const files = ['a.md', 'b/c.md']
    expect(excludeGlobbedAgentFiles(files, ['**/*.md'])).toEqual(files)
  })
})
