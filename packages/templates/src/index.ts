export type {
  Template,
  TemplateType,
  TemplateVar,
  TemplateVariables,
  TemplateRegistry,
  ExtendTemplateOptions,
  TemplateError,
  TemplateErrorType,
  Result,
} from './types.ts'

export { TEMPLATE_TYPES } from './types.ts'
export { getBuiltInTemplates } from './built-in.ts'

export { createRegistry } from './registry.ts'

export { defineTemplate } from './define.ts'

export { buildTemplate } from './build.ts'
export type { BuildTemplateInput } from './build.ts'

export { render, toSlug, findMarkers } from './render.ts'
