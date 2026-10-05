'use strict'

// Host entry for the @ch4acko3/dsh-turn-fold Harmony provider.
const { SETTINGS_NAMESPACE, createConfigSchema, createSettingsSchema } = require('./settings.cjs')

// Resolve the schema after the Host has finished importing its ESM graph.
Object.defineProperty(exports, 'Config', { enumerable: true, get: createConfigSchema })
exports.inject = ['harmony']
exports.apply = (ctx, config) => {
  ctx.inject(['settings'], (settingsCtx) => {
    if (typeof settingsCtx.settings.configure === 'function') {
      settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber))
    } else {
      const summaryFields = typeof config.summaryFields.get === 'function' ? config.summaryFields.get() : config.summaryFields
      settingsCtx.settings.register(SETTINGS_NAMESPACE, createSettingsSchema(), { base: { ...config, summaryFields } })
    }
  })
}
