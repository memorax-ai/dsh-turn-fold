'use strict'

const SETTINGS_NAMESPACE = 'dsh-turn-fold'

const SUMMARY_FIELDS = [
  'duration',
  'toolCalls',
  'modelCalls',
  'inputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheWriteTokens',
  'reasoningTokens',
  'timeToFirstToken',
  'tokensPerSecond',
]

const DEFAULT_SUMMARY_FIELDS = [
  'duration',
  'toolCalls',
  'inputTokens',
  'outputTokens',
]

function decodeConfig(value) {
  const source = value == null ? {} : value
  if (typeof source !== 'object' || Array.isArray(source)) throw new TypeError('expected config to be an object')
  const summaryFields = source.summaryFields === undefined ? DEFAULT_SUMMARY_FIELDS : source.summaryFields
  if (!Array.isArray(summaryFields)) throw new TypeError('summaryFields must be an array')
  for (const field of summaryFields) {
    if (!SUMMARY_FIELDS.includes(field)) throw new TypeError(`unknown summary field: ${String(field)}`)
  }
  return { ...source, summaryFields: summaryFields.slice() }
}

function Config(value) {
  return decodeConfig(value)
}

Object.defineProperty(Config, '~standard', {
  value: {
    version: 1,
    vendor: '@ch4acko3/dsh-turn-fold',
    validate(value) {
      try {
        return { value: decodeConfig(value) }
      } catch (error) {
        return { issues: [{ message: error instanceof Error ? error.message : String(error) }] }
      }
    },
  },
})

let settingsSchema
let configSchema
function createConfigSchema() {
  if (configSchema !== undefined) return configSchema
  const z = require('@deepseek-ai/schemastery')
  configSchema = z.object({
    summaryFields: z.array(z.union(SUMMARY_FIELDS)).default(DEFAULT_SUMMARY_FIELDS).volatile(),
  })
  return configSchema
}
function createSettingsSchema() {
  if (settingsSchema !== undefined) return settingsSchema
  // The Host loads CommonJS providers alongside the ESM settings graph. Defer
  // Schemastery until that service is ready to avoid a Node 24 CJS/ESM race.
  const z = require('@deepseek-ai/schemastery')
  settingsSchema = z.object({
    summaryFields: z.array(z.union(SUMMARY_FIELDS)).default(DEFAULT_SUMMARY_FIELDS),
  })
  return settingsSchema
}

module.exports = {
  Config,
  createSettingsSchema,
  createConfigSchema,
  DEFAULT_SUMMARY_FIELDS,
  SETTINGS_NAMESPACE,
  SUMMARY_FIELDS,
}
