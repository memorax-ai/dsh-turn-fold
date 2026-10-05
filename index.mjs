// Let Node settle the schema's ESM dependencies before the CommonJS helper
// constructs the live Config schema.
import '@deepseek-ai/schemastery'
import provider from './index.cjs'

export const Config = provider.Config
export const inject = provider.inject
export const apply = provider.apply
