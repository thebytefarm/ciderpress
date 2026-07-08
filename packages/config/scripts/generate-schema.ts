import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { z } from 'zod'

import { ciderpressConfigSchema } from '../src/schema.ts'

const packageJsonPath = resolve(import.meta.dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string }
const currentVersion = packageJson.version

try {
  // `io: 'input'` emits the schema for the config a user *writes*, not the
  // parsed output. Fields carrying a `.default()` stay optional (a default
  // means "you may omit it") while still surfacing their `default` value for
  // editor hints — the 'output' target would instead mark them `required`.
  const rawJsonSchema = z.toJSONSchema(ciderpressConfigSchema, {
    target: 'draft-7',
    unrepresentable: 'any',
    io: 'input',
  })
  const jsonSchema = applyTupleLengthBounds(rawJsonSchema) as Record<string, unknown>

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://raw.githubusercontent.com/thebytefarm/ciderpress/v${currentVersion}/packages/config/schemas/schema.json`,
    title: 'Ciderpress Configuration',
    description: 'Configuration file for ciderpress documentation framework',
    ...jsonSchema,
  }

  const schemasDir = resolve(import.meta.dirname, '../schemas')
  mkdirSync(schemasDir, { recursive: true })

  const schemaPath = resolve(schemasDir, 'schema.json')
  writeFileSync(schemaPath, JSON.stringify(schema, null, 2))

  console.log(`✓ Generated JSON Schema at ${schemaPath}`)
} catch (error) {
  console.error('✗ Failed to generate JSON Schema:')
  console.error(getErrorMessage(error))
  process.exit(1)
}

/**
 * Walk the generated JSON Schema tree and add `minItems` / `maxItems` to
 * every tuple item — JSON Schema draft-07 represents tuples as `items: [
 * ...positional schemas]`, but Zod's `toJSONSchema` emits the positional
 * array without length constraints. Without these, IDEs accept malformed
 * arrays that the matching Zod runtime validator rejects.
 *
 * The walk is non-destructive — returns a new tree rather than mutating
 * the input.
 */
function applyTupleLengthBounds(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(applyTupleLengthBounds)
  }
  if (node === null || typeof node !== 'object') {
    return node
  }
  const record = node as Record<string, unknown>
  const { items } = record
  if (Array.isArray(items)) {
    const { length } = items
    return {
      ...Object.fromEntries(Object.entries(record).map(([k, v]) => [k, applyTupleLengthBounds(v)])),
      minItems: length,
      maxItems: length,
    }
  }
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, applyTupleLengthBounds(v)]))
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
