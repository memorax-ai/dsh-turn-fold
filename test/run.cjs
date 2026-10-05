'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const assert = require('node:assert')
const semver = require('semver')
const ts = require('typescript')
const { tsquery } = require('@phenomnomnominal/tsquery')
const React = require('react')
const reactJsxRuntime = require('react/jsx-runtime')
const TestRenderer = require('react-test-renderer')

const ROOT = path.join(__dirname, '..')
const INLINE = require(path.join(ROOT, 'inline-source.cjs'))
const PATCHES = require(path.join(ROOT, 'patch.cjs'))
const LEGACY_PATCHES = PATCHES.createPatches('0.1.1-rc.2')
const DSH_012_PATCHES = PATCHES.createPatches('0.1.2-alpha.5')
const LOCALES = require(path.join(ROOT, 'locales.cjs'))
const { DEFAULT_SUMMARY_FIELDS, SUMMARY_FIELDS } = require(path.join(ROOT, 'settings.cjs'))
const TARGET_PACKAGE = require.resolve('@deepseek-ai/dsh-client-ui-conversation/package.json', { paths: [ROOT] })
const TARGET_ROOT = path.dirname(TARGET_PACKAGE)
const TARGET_PATH = path.join(TARGET_ROOT, 'lib/client.js')
const DSH_012_PACKAGE = require.resolve('@deepseek-ai/dsh-client-ui-chat/package.json', { paths: [process.env.DSH_TURN_FOLD_UPSTREAM_ROOT || ROOT] })
const DSH_012_PATH = path.join(path.dirname(DSH_012_PACKAGE), 'lib/client.js')
const UPSTREAM_VERSION = JSON.parse(fs.readFileSync(DSH_012_PACKAGE, 'utf8')).version
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const LOCKFILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'))

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    process.stdout.write(`ok - ${name}\n`)
  } catch (error) {
    failed++
    process.stdout.write(`FAIL - ${name}\n`)
    process.stdout.write(`  ${error && error.message ? error.message : error}\n`)
    if (error && error.stack) {
      for (const line of error.stack.split('\n').slice(1, 4)) process.stdout.write(`  ${line}\n`)
    }
  }
}

function deepEqual(actual, expected, message) {
  assert.deepStrictEqual(actual, expected, message)
}

function sourceFile(name, source) {
  return ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
}

function applyPatch(source, patch, targetPath = TARGET_PATH) {
  const sf = sourceFile(targetPath, source)
  const nodes = tsquery(sf, patch.select)
  deepEqual(nodes.length, patch.expect, `${patch.id}: expected ${patch.expect} selector match, got ${nodes.length}`)
  const edits = []
  const edit = {
    prependLeft(at, text) {
      edits.push({ start: at, end: at, text })
    },
    overwrite(start, end, text) {
      edits.push({ start, end, text })
    },
  }
  for (const node of nodes) patch.apply({ node, sourceFile: sf, edit })
  edits.sort((left, right) => right.start - left.start || right.end - left.end)
  let result = source
  for (const candidate of edits) {
    result = result.slice(0, candidate.start) + candidate.text + result.slice(candidate.end)
  }
  return result
}

// ---- Published target and transformed bundle --------------------------------

test('target: installed DSH stays inside the bounded Patch compatibility range', () => {
  const manifest = JSON.parse(fs.readFileSync(TARGET_PACKAGE, 'utf8'))
  assert.ok(semver.satisfies(manifest.version, LEGACY_PATCHES[0].target.version, { includePrerelease: true }))
  assert.ok(semver.satisfies('0.1.0-rc.8', LEGACY_PATCHES[0].target.version, { includePrerelease: true }))
  assert.ok(semver.satisfies('0.1.1-rc.2', LEGACY_PATCHES[0].target.version, { includePrerelease: true }))
  assert.ok(!semver.satisfies('0.1.1-rc.3', LEGACY_PATCHES[0].target.version, { includePrerelease: true }))
  assert.ok(semver.satisfies('0.1.2-alpha.5', DSH_012_PATCHES[0].target.version, { includePrerelease: true }))
  assert.ok(!semver.satisfies('0.1.8-alpha.1', DSH_012_PATCHES[0].target.version, { includePrerelease: true }))
  assert.ok(semver.satisfies('0.2.0-rc.2', DSH_012_PATCHES[0].target.version))
  assert.ok(!semver.satisfies('0.2.0-rc.3', DSH_012_PATCHES[0].target.version))
  for (const version of ['0.1.5-rc.2', '0.1.6-alpha.2', '0.1.7-rc.2']) {
    assert.ok(semver.satisfies(version, DSH_012_PATCHES[0].target.version, { includePrerelease: true }))
    assert.ok(semver.satisfies(version, MANIFEST.peerDependencies['@deepseek-ai/dsh-client-ui-chat']))
  }
  deepEqual(LEGACY_PATCHES[0].target.package, '@deepseek-ai/dsh-client-ui-conversation')
  deepEqual(DSH_012_PATCHES[0].target.package, '@deepseek-ai/dsh-client-ui-chat')
  deepEqual(PATCHES.createPatches('0.1.3-alpha.1')[0].target.package, '@deepseek-ai/dsh-client-ui-chat')
})

test('provider: scoped package name matches the DSH bundle registration', () => {
  deepEqual(MANIFEST.name, '@ch4acko3/dsh-turn-fold')
  deepEqual(MANIFEST.publishConfig, { access: 'public' })
  deepEqual(LOCKFILE.name, MANIFEST.name)
  deepEqual(LOCKFILE.version, MANIFEST.version)
  deepEqual(LOCKFILE.packages[''].name, MANIFEST.name)
  deepEqual(LOCKFILE.packages[''].version, MANIFEST.version)
  const bundlePatch = fs.readFileSync(path.join(ROOT, 'harmony.patch.yml'), 'utf8')
  assert.match(bundlePatch, /id: ch4acko3-dsh-turn-fold/)
  assert.match(bundlePatch, /name: '@ch4acko3\/dsh-turn-fold'/)
})

test('release: npm publication gates an idempotent GitHub Release', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/release.yml'), 'utf8').replaceAll('\r\n', '\n')
  assert.match(workflow, /publish:\n\s+permissions:\n\s+contents: read\n\s+id-token: write/)
  assert.match(workflow, /github-release:\n\s+needs: publish\n\s+permissions:\n\s+contents: write/)
  assert.match(workflow, /gh release view "\$GITHUB_REF_NAME" --repo "\$GITHUB_REPOSITORY"/)
  assert.match(workflow, /gh release create "\$GITHUB_REF_NAME"[\s\S]*--verify-tag[\s\S]*--generate-notes/)
})

test('provider: native settings schema exposes every summary metric with the intended defaults', () => {
  deepEqual(MANIFEST.dependencies['@deepseek-ai/schemastery'], '^3.18.4')
  deepEqual(MANIFEST.peerDependencies, {
    '@deepseek-ai/dsh-client-ui-chat': '>=0.1.2-alpha.5 <0.1.3-0 || >=0.1.3-0 <0.1.4-0 || >=0.1.4-0 <0.1.5-0 || >=0.1.5-0 <0.1.6-0 || >=0.1.6-0 <0.1.7-0 || >=0.1.7-0 <0.1.8-0 || 0.2.0-rc.2',
    '@deepseek-ai/dsh-client-ui-conversation': '>=0.1.0-rc.8 <=0.1.1-rc.2 || >=0.1.2-alpha.5 <0.1.3-0 || >=0.1.3-0 <0.1.4-0 || >=0.1.4-0 <0.1.5-0 || >=0.1.5-0 <0.1.6-0 || >=0.1.6-0 <0.1.7-0 || >=0.1.7-0 <0.1.8-0 || 0.2.0-rc.2',
    '@deepseek-ai/dsh-settings': '>=0.1.0-rc.8 <=0.1.1-rc.2 || >=0.1.2-alpha.5 <0.1.3-0 || >=0.1.3-0 <0.1.4-0 || >=0.1.4-0 <0.1.5-0 || >=0.1.5-0 <0.1.6-0 || >=0.1.6-0 <0.1.7-0 || >=0.1.7-0 <0.1.8-0 || 0.2.0-rc.2',
    'dsh-harmony': '^0.8.11',
  })
  deepEqual(MANIFEST.peerDependenciesMeta, {
    '@deepseek-ai/dsh-client-ui-chat': { optional: true },
    '@deepseek-ai/dsh-client-ui-conversation': { optional: true },
    '@deepseek-ai/dsh-settings': { optional: true },
    'dsh-harmony': { optional: true },
  })
  assert.ok(semver.satisfies('0.1.0-rc.8', MANIFEST.peerDependencies['@deepseek-ai/dsh-client-ui-conversation'], { includePrerelease: true }))
  assert.ok(semver.satisfies('0.1.1-rc.2', MANIFEST.peerDependencies['@deepseek-ai/dsh-client-ui-conversation'], { includePrerelease: true }))
  assert.ok(semver.satisfies('0.1.2-alpha.5', MANIFEST.peerDependencies['@deepseek-ai/dsh-client-ui-conversation'], { includePrerelease: true }))
  assert.ok(!semver.satisfies('0.1.1-rc.3', MANIFEST.peerDependencies['@deepseek-ai/dsh-client-ui-conversation'], { includePrerelease: true }))
  assert.ok(!semver.satisfies('0.8.9', MANIFEST.peerDependencies['dsh-harmony']))
  assert.ok(semver.satisfies('0.8.11', MANIFEST.peerDependencies['dsh-harmony']))
  assert.ok(!semver.satisfies('0.9.0', MANIFEST.peerDependencies['dsh-harmony']))
  const hostConfig = require(path.join(ROOT, 'index.cjs')).Config
  deepEqual(hostConfig({}).summaryFields.get(), DEFAULT_SUMMARY_FIELDS)
  deepEqual(hostConfig['~standard'].validate({}).value.summaryFields.get(), DEFAULT_SUMMARY_FIELDS)
  assert.ok(hostConfig['~standard'].validate({ summaryFields: ['unknown'] }).issues)
  deepEqual(SUMMARY_FIELDS, [
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
  ])
})

test('provider: host entry registers the dsh-turn-fold settings namespace', () => {
  const hostSource = fs.readFileSync(path.join(ROOT, 'index.cjs'), 'utf8')
  assert.doesNotMatch(hostSource, /require\(['"]@deepseek-ai\/dsh-settings['"]\)/)
  const provider = require(path.join(ROOT, 'index.cjs'))
  const config = provider.Config({ summaryFields: ['duration', 'reasoningTokens'] })
  let registration
  provider.apply({
    inject(services, start) {
      deepEqual(services, ['settings'])
      start({
        settings: {
          register(namespace, schema, options) {
            registration = { namespace, schema, options }
          },
        },
      })
    },
  }, config)
  deepEqual(registration.namespace, 'dsh-turn-fold')
  deepEqual(registration.schema({}), { summaryFields: DEFAULT_SUMMARY_FIELDS })
  deepEqual(registration.options, { base: { summaryFields: ['duration', 'reasoningTokens'] } })
})

test('provider: rc.2 projects volatile fields and owns its native page policy', () => {
  const provider = require(path.join(ROOT, 'index.cjs'))
  const schema = provider.Config
  assert.ok(schema.dict.summaryFields.meta.volatile)
  let configured
  const fiber = {}
  provider.apply({ fiber, inject(services, start) {
    deepEqual(services, ['settings'])
    start({ effect(start) { return start() }, settings: {
      configure(options, owner) { configured = { options, owner }; return () => {} },
    } })
  } }, schema({}))
  deepEqual(configured, { options: { auto: false }, owner: fiber })
})

test('provider: host entry loads while the ESM settings graph is still importing', () => {
  const script = `
    const loading = import('@deepseek-ai/dsh-settings')
    try {
      require(${JSON.stringify(path.join(ROOT, 'index.cjs'))})
    } catch (error) {
      console.error(error && error.stack ? error.stack : error)
      process.exitCode = 1
    }
    loading.catch((error) => {
      console.error(error && error.stack ? error.stack : error)
      process.exitCode = 1
    })
  `
  const result = spawnSync(process.execPath, ['-e', script], { cwd: ROOT, encoding: 'utf8' })
  deepEqual(result.status, 0, result.stderr || result.stdout)
})

test('locale files: native zh and en dictionaries have the same non-empty key set', () => {
  deepEqual(Object.keys(LOCALES.zh).sort(), Object.keys(LOCALES.en).sort())
  assert.ok(Object.values(LOCALES.zh).every((value) => typeof value === 'string' && value.length > 0))
  assert.ok(Object.values(LOCALES.en).every((value) => typeof value === 'string' && value.length > 0))
})

test('provider: every Source Patch has an exact selector contract', () => {
  for (const patch of [...LEGACY_PATCHES, ...DSH_012_PATCHES]) {
    assert.ok(typeof patch.description === 'string' && patch.description.length > 0, `${patch.id}: description must explain the Patch`)
    deepEqual(patch.expect, 1, `${patch.id}: expect must stay exact`)
    deepEqual(patch.target.file, 'lib/client.js', `${patch.id}: target must use the Harmony file contract`)
    deepEqual(patch.target.files, undefined, `${patch.id}: legacy target files must stay removed`)
    assert.ok(patch.target.version, `${patch.id}: target version range must stay bounded`)
  }
})

const targetSource = fs.readFileSync(TARGET_PATH, 'utf8')
let transformedSource = targetSource
for (const patch of LEGACY_PATCHES) transformedSource = applyPatch(transformedSource, patch)
const dsh012TargetSource = fs.readFileSync(DSH_012_PATH, 'utf8')
let dsh012TransformedSource = dsh012TargetSource
for (const patch of PATCHES.createPatches(UPSTREAM_VERSION)) dsh012TransformedSource = applyPatch(dsh012TransformedSource, patch, DSH_012_PATH)

test('selectors: injected runtime does not re-match the render-loop selector', () => {
  for (const patch of [LEGACY_PATCHES[1], DSH_012_PATCHES[1]]) {
    const nodes = tsquery(sourceFile('inline.js', INLINE), patch.select)
    deepEqual(nodes.length, 0)
  }
})

test('runtime: internal code and DOM identifiers are scoped to the package owner', () => {
  assert.doesNotMatch(INLINE, /__dshTurnFold|__dsh-turn-fold|data-turn-fold/)
  assert.match(INLINE, /__ch4acko3DshTurnFold/)
  assert.match(INLINE, /data-dsh-fold-owner/)
  assert.match(INLINE, /@ch4acko3\/dsh-turn-fold/)
})

test('transform: final browser bundle parses without syntax errors', () => {
  const sf = sourceFile('client.patched.js', transformedSource)
  deepEqual(sf.parseDiagnostics.length, 0)
  assert.match(transformedSource, /__ch4acko3DshTurnFoldRender\(\{ order, nodeStore, timeline, sessionId, renderNode:/)
  assert.match(transformedSource, /const t = ctx\.locale\.bind\(NS\);\s+__ch4acko3DshTurnFoldInstall\(ctx\);/)
})

test('transform: modern DSH chat bundle uses the new renderer seam and parses', () => {
  const sf = sourceFile('client-012.patched.js', dsh012TransformedSource)
  deepEqual(sf.parseDiagnostics.length, 0)
  assert.match(dsh012TransformedSource, /__ch4acko3DshTurnFoldRender\(\{ order, nodeStore, timeline: (?:timeline|__ch4acko3DshTurnFoldTimeline), sessionId, renderNode: \(nodeKey\) =>/)
  assert.match(dsh012TransformedSource, /ChatNodeSeat, \{ \.\.\.\(\{/)
  assert.match(dsh012TransformedSource, /const t = ctx\.locale\.bind\(NS\);\s+__ch4acko3DshTurnFoldInstall\(ctx\);/)
})

test('target: closing-reasoning extraction stays bound to the native semantic row contract', () => {
  assert.match(targetSource, /function ReasoningRow\(/)
  assert.match(targetSource, /"data-variant": "think"/)
  assert.match(INLINE, /react_jsx_runtime\.jsx\(ReasoningRow,/)
  assert.match(INLINE, /\[data-variant=think\]\{display:none\}/)
})

test('transform: preserves an earlier Patch extension inside the native node renderer', () => {
  const original = '\t\t\t\t\t\t\t\tfileMentions,\n\t\t\t\t\t\t\t\trenderSlot,'
  const extended = `${original.split('\n')[0]}\n\t\t\t\t\t\t\t\tthirdPartyCompatibilityMarker,\n\t\t\t\t\t\t\t\trenderSlot,`
  assert.ok(targetSource.includes(original), 'published node renderer shape changed')
  let composed = targetSource.replace(original, extended)
  for (const patch of LEGACY_PATCHES) composed = applyPatch(composed, patch)
  assert.match(composed, /renderNode: \(nodeKey\) =>/)
  assert.match(composed, /thirdPartyCompatibilityMarker/)
})

test('transform: runtime injection accepts a ChatView decorated by an earlier Component Patch', () => {
  const sf = sourceFile(TARGET_PATH, targetSource)
  const [chatView] = tsquery(sf, 'FunctionDeclaration[name.name="ChatView"]')
  assert.ok(chatView, 'published ChatView declaration is missing')
  const decorated = targetSource.slice(0, chatView.getStart(sf))
    + `const ChatView = decorate(${targetSource.slice(chatView.getStart(sf), chatView.getEnd())});`
    + targetSource.slice(chatView.getEnd())
  let composed = decorated
  for (const patch of LEGACY_PATCHES) composed = applyPatch(composed, patch)
  deepEqual(sourceFile('client.decorated.patched.js', composed).parseDiagnostics.length, 0)
  assert.match(composed, /__ch4acko3DshTurnFoldLocaleNamespace[\s\S]+const ChatView = decorate\(function ChatView/)
  assert.match(composed, /__ch4acko3DshTurnFoldRender\(\{ order, nodeStore, timeline, sessionId, renderNode:/)
})

// ---- Runtime sandbox ---------------------------------------------------------

function formatDuration(ms, t) {
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes > 0
    ? t('duration.minutes', { minutes, seconds: String(seconds).padStart(2, '0') })
    : t('duration.seconds', { seconds })
}

function compactTokens(value) {
  if (value >= 1e6) return `${Math.round(value / 1e5) / 10}M`
  if (value >= 1e3) return `${Math.round(value / 100) / 10}K`
  return String(value)
}

function buildRuntime(react, jsxRuntime, modern = false, durationFormatter = formatDuration) {
  const INLINE = PATCHES.runtimeSource(modern ? '0.2.0-rc.2' : '0.1.2-alpha.5')
  const ReasoningRow = ({ text }) => jsxRuntime.jsx('div', { 'data-test-reasoning': text, children: text })
  const uiPrimitives = {
    DisclosureRow({ icon, title, collapsedContent, open, onToggle, children, ...props }) {
      return jsxRuntime.jsxs('div', {
        ...props,
        'data-test-disclosure-row': '',
        children: [
          jsxRuntime.jsxs('button', { type: 'button', 'aria-expanded': open, onClick: onToggle, children: [icon, title, collapsedContent] }),
          open ? children : null,
        ],
      })
    },
    IconApiOutline14: ({ size }) => jsxRuntime.jsx('span', { 'data-test-tool-icon': size }),
    IconChevronDownOutline14: ({ className }) => jsxRuntime.jsx('span', { className, 'data-test-settings-chevron': '' }),
    StateDot: ({ state }) => jsxRuntime.jsx('span', { 'data-test-state-dot': state }),
  }
  if (modern) {
    uiPrimitives.IconApiOutlineRegular = uiPrimitives.IconApiOutline14
    uiPrimitives.IconChevronDownOutlineRegular = uiPrimitives.IconChevronDownOutline14
    delete uiPrimitives.IconApiOutline14
    delete uiPrimitives.IconChevronDownOutline14
  }
  const factory = new Function(
    'react',
    'react_jsx_runtime',
    'ReasoningRow',
    'formatRunDuration',
    'formatTokens',
    '_deepseek_ai_dsh_client_ui_primitives',
    `${INLINE}\nreturn { render: __ch4acko3DshTurnFoldRender, disclosure: __ch4acko3DshTurnFoldDisclosure, activityGroup: __ch4acko3DshTurnFoldActivityGroup, summary: __ch4acko3DshTurnFoldSummary, chevron: __ch4acko3DshTurnFoldChevron, settingsCard: __ch4acko3DshTurnFoldSettingsCard, insertionIndex: __ch4acko3DshTurnFoldInsertionIndex, dropDestination: __ch4acko3DshTurnFoldDropDestination, metrics: __ch4acko3DshTurnFoldPlanMetrics, usage: __ch4acko3DshTurnFoldUsage, interactionKeys: __ch4acko3DshTurnFoldInteractionKeys, install: __ch4acko3DshTurnFoldInstall };`,
  )
  const runtime = factory(react, jsxRuntime, ReasoningRow, durationFormatter, compactTokens, uiPrimitives)
  let locale = 'en'
  let registered
  let settings = { summaryFields: DEFAULT_SUMMARY_FIELDS }
  let settingsDecoder
  let settingsSnapshot
  const settingsListeners = new Set()
  const registeredSlots = []
  const context = {
    effect(start) {
      return start()
    },
    locale: {
      register(_namespace, dictionaries) {
        registered = dictionaries
        return () => {}
      },
      bind() {
        return (key, params = {}) => registered[locale][key].replace(/\{([^}]+)\}/g, (_match, name) => String(params[name]))
      },
    },
    settingsScope: {
      bind({ decode }) {
        settingsDecoder = decode
        settingsSnapshot = { status: 'ready', value: decode(settings), writable: true }
        return {
          getSnapshot: () => settingsSnapshot,
          subscribe(listener) {
            settingsListeners.add(listener)
            return () => settingsListeners.delete(listener)
          },
          set(field, value) {
            settings = { ...settings, [field]: value }
            settingsSnapshot = { ...settingsSnapshot, value: decode(settings) }
            for (const listener of settingsListeners) listener()
            return { then(resolve) { resolve() } }
          },
        }
      },
    },
    slots: {
      inject(name, start) {
        deepEqual(name, modern ? 'settings.plugins.tab' : 'settings.plugin.item')
        start()
      },
      register(options, component) {
        registeredSlots.push({ options, component })
        return () => {}
      },
    },
  }
  if (modern) {
    const bind = context.settingsScope.bind
    context.configForms = { get(namespace) {
      deepEqual(namespace, 'ch4acko3-dsh-turn-fold')
      return bind({ decode: value => value })
    } }
    delete context.settingsScope
  }
  runtime.install(context)
  runtime.setLocale = (next) => {
    locale = next
  }
  runtime.setSummaryFields = (summaryFields) => {
    settings = { summaryFields }
    settingsSnapshot = { ...settingsSnapshot, value: settingsDecoder(settings) }
    for (const listener of settingsListeners) listener()
  }
  runtime.registeredSlots = registeredSlots
  return runtime
}

if (process.env.DSH_TURN_FOLD_UPSTREAM_ROOT) test('target: runtime components exist in the selected upstream primitive exports', () => {
  const manifestPath = require.resolve('@deepseek-ai/dsh-client-ui-primitives/package.json', { paths: [process.env.DSH_TURN_FOLD_UPSTREAM_ROOT || ROOT] })
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const sf = sourceFile('primitives.js', fs.readFileSync(path.join(path.dirname(manifestPath), manifest.main), 'utf8'))
  const exports = new Set(tsquery(sf, 'ExportSpecifier').map(node => node.name.text))
  const names = [...PATCHES.runtimeSource(UPSTREAM_VERSION).matchAll(/_deepseek_ai_dsh_client_ui_primitives\.([A-Za-z0-9_]+)/g)].map(match => match[1])
  for (const name of names) assert.ok(exports.has(name), `upstream ${manifest.version} does not export ${name}`)
})

test('transform: chat timeline resolves from the native hook when the upstream local binding is absent', () => {
  const sf = sourceFile('chat-timeline.patched.js', dsh012TransformedSource)
  const [chatView] = tsquery(sf, 'FunctionDeclaration[name.name="ChatView"]')
  const [render] = tsquery(chatView, 'CallExpression[expression.name="__ch4acko3DshTurnFoldRender"]')
  const timeline = render.arguments[0].properties.find(property => property.name?.getText(sf) === 'timeline')
  assert.ok(timeline && ts.isPropertyAssignment(timeline))
  const declaration = chatView.body.statements.find(statement => statement.declarationList?.declarations.some(item => item.name.getText(sf) === '__ch4acko3DshTurnFoldTimeline'))
  const resolve = new Function('useChat', 'timeline', `${declaration ? declaration.getText(sf) : ''}\nreturn ${timeline.initializer.getText(sf)};`)
  const expected = { turns: new Map(), turnOrder: [], playbackClock: { kind: 'historical', time: 1234 } }
  assert.strictEqual(resolve(selector => selector({ timeline: expected }), expected), expected)
})

function buildSandbox(durationFormatter = formatDuration) {
  const jsx = (type, props, key) => ({ __el: 'jsx', type, props: props || {}, key })
  const jsxs = (type, props, key) => ({ __el: 'jsxs', type, props: props || {}, key })
  const ChatNodeSeat = { __seat: true }
  const react = {
    useState(initial) {
      return [typeof initial === 'function' ? initial() : initial, () => {}]
    },
    useRef(initial) {
      return { current: initial }
    },
    useEffect() {},
    useSyncExternalStore(_subscribe, getSnapshot) {
      return getSnapshot()
    },
  }
  const runtime = buildRuntime(react, { jsx, jsxs }, false, durationFormatter)
  const renderCalls = []
  const renderNode = (key) => {
    renderCalls.push(key)
    return jsx(ChatNodeSeat, { nodeKey: key, compatibilityMarker: true }, key)
  }
  const api = {
    ...runtime,
    render: (props) => runtime.render({
      ...props,
      renderNode,
      t: (key, params) => key === 'duration.seconds' ? `${params.seconds}s` : `${params.minutes}m ${params.seconds}s`,
    }),
  }
  return { api, ChatNodeSeat, renderNode, renderCalls }
}

function turnLocation(turn, status, startTime, endTime, reason = 'completed') {
  return {
    turn,
    status,
    start: startTime === undefined ? undefined : { time: startTime },
    end: endTime === undefined ? undefined : { time: endTime, data: { reason: { kind: reason } } },
  }
}

function nodeStoreFrom(nodes) {
  const map = new Map()
  for (const node of nodes) map.set(node.key, node)
  return { get: (key) => map.get(key) }
}

function timelineFrom(turns) {
  const map = new Map()
  for (const turn of turns) map.set(turn.turn, turn)
  return { turns: map }
}

function classify(out, api, ChatNodeSeat) {
  return out.map((element) => {
    if (element.type === api.disclosure) return { kind: 'disclosure', key: element.key, props: element.props }
    if (element.type === api.activityGroup) return { kind: 'activity-group', key: element.key, props: element.props }
    if (element.type === api.summary) return { kind: 'summary', key: element.key, props: element.props }
    if (element.type === ChatNodeSeat) return { kind: 'seat', nodeKey: element.props.nodeKey }
    if (element.props?.className === '__ch4acko3-dsh-turn-fold__activityText') return { kind: 'activity-text', child: element.props.children }
    if (element.props?.className === '__ch4acko3-dsh-turn-fold__closing') return { kind: 'closing', child: element.props.children }
    return { kind: 'other', type: element.type }
  })
}

function elementText(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(elementText).join('')
  if (value && typeof value === 'object') return elementText(value.props?.children)
  return ''
}

function elementsWithClass(value, className, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) elementsWithClass(item, className, out)
  } else if (value && typeof value === 'object') {
    if (value.props?.className === className) out.push(value)
    elementsWithClass(value.props?.children, className, out)
  }
  return out
}

function elementsOfType(value, type, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) elementsOfType(item, type, out)
  } else if (value && typeof value === 'object') {
    if (value.type === type) out.push(value)
    elementsOfType(value.props?.children, type, out)
  }
  return out
}

function completedFixture(options = {}) {
  const turn = turnLocation(1, 'closed', options.startTime ?? 1000, options.endTime ?? 85000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 1, finalNode: { seq: 10 }, usage: { inputTokens: 1000, outputTokens: 500, cacheReadTokens: 200 } } },
    { key: 'tool-1', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
    { key: 'steering', kind: 'steering', location: { kind: 'step', turn }, data: { content: 'continue' } },
    { key: 'tool-2', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
    { key: 'answer', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 2, finalNode: { seq: 20 }, usage: { inputTokens: 2000, outputTokens: 900, cacheReadTokens: 100, cacheWriteTokens: 50, reasoningTokens: 300 } } },
    { key: 'tail', kind: 'turn-tail', location: { kind: 'turn', turn }, data: { turn: 1, closing: { finalNode: { seq: 20 } }, branchUnavailable: options.branchUnavailable === true } },
  ]
  return { turn, nodes, order: nodes.map((node) => node.key) }
}

test('fold: one disclosure collects activity split by a steering node', () => {
  const { api, ChatNodeSeat, renderNode } = buildSandbox()
  const fixture = completedFixture()
  const out = api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  })
  const result = classify(out, api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'seat', 'disclosure', 'seat', 'seat'])
  deepEqual(result.map((item) => item.nodeKey).filter(Boolean), ['user', 'steering', 'answer', 'tail'])
  deepEqual(result[2].props.activity, ['think', 'tool-1', 'tool-2'])
  deepEqual(result[2].props.metrics.durationMs, 84000)
  deepEqual(result[2].props.metrics.toolCalls, 2)
  deepEqual(result[2].props.metrics.modelCalls, 2)
  deepEqual(result[2].props.metrics.inputTokens, 3350)
  deepEqual(result[2].props.metrics.outputTokens, 1400)
  deepEqual(result[2].props.metrics.cacheReadTokens, 300)
  deepEqual(result[2].props.metrics.cacheWriteTokens, 50)
  deepEqual(result[2].props.metrics.reasoningTokens, 300)
  deepEqual(result[2].props.foldKey, 'session-a:1')
  deepEqual(result[2].props.renderNode, renderNode)
  deepEqual(result[2].key, 'ch4acko3-dsh-turn-fold-session-a-1')
})

test('fold: image tool results promote out of the disclosure and render before the final answer', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const turn = turnLocation(1, 'closed', 1000, 85000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 1, finalNode: { seq: 10 }, usage: { inputTokens: 1000, outputTokens: 500, cacheReadTokens: 200 } } },
    { key: 'tool-img', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', call: { name: 'generate_image' }, content: [{ type: 'text', text: 'ok' }, { type: 'image', attachment: { id: 'a' } }] } } },
    { key: 'tool-norm', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', call: { name: 'pwsh' }, content: [{ type: 'text', text: 'done' }] } } },
    { key: 'answer', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 2, finalNode: { seq: 20 }, usage: { inputTokens: 2000, outputTokens: 900, cacheReadTokens: 100 } } },
    { key: 'tail', kind: 'turn-tail', location: { kind: 'turn', turn }, data: { closing: { finalNode: { seq: 20 } } } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-img',
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'disclosure', 'seat', 'seat', 'seat'])
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), ['user', 'tool-img', 'answer', 'tail'])
  const disclosure = result.find((item) => item.kind === 'disclosure')
  deepEqual(disclosure.props.activity, ['think', 'tool-norm'])
  deepEqual(disclosure.props.foldKey, 'session-img:1')
})

test('fold: reasoning in the closing assistant node moves into the disclosure without duplicating the final answer', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const turn = turnLocation(2, 'closed', 1000, 5000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    {
      key: 'answer',
      kind: 'assistant-step',
      location: { kind: 'step', turn },
      data: {
        step: 1,
        blocks: [
          { kind: 'reasoning', text: 'closing thought' },
          { kind: 'text', text: 'visible answer' },
        ],
        finalNode: { seq: 20 },
        usage: { inputTokens: 100, outputTokens: 50 },
      },
    },
    { key: 'tail', kind: 'turn-tail', location: { kind: 'turn', turn }, data: { closing: { finalNode: { seq: 20 } } } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-closing-reasoning',
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'disclosure', 'closing', 'seat'])
  deepEqual(result[1].props.activity, [])
  deepEqual(result[1].props.closingReasoning, ['closing thought'])
  deepEqual(result[2].child.type, ChatNodeSeat)
  deepEqual(result[2].child.props.nodeKey, 'answer')
})

test('summary: a running turn shows a top bar before activity without hiding streamed nodes', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const startTime = Date.now() - 4200
  const turn = turnLocation(3, 'open', startTime)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'running-answer', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 1, usage: { inputTokens: 800, outputTokens: 120 } } },
    { key: 'running-tool', kind: 'tool-call', location: { kind: 'step', turn }, data: {} },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-running',
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'summary', 'seat', 'seat'])
  deepEqual(result[1].props.running, true)
  deepEqual(result[1].props.metrics.startTime, startTime)
  deepEqual(result[1].props.metrics.durationMs, null)
  deepEqual(result[1].props.metrics.toolCalls, 1)
  deepEqual(result[1].props.metrics.inputTokens, 800)
  deepEqual(result[1].props.metrics.outputTokens, 120)

  const summary = api.summary(result[1].props)
  const header = summary.props.children[0]
  deepEqual(header.props['aria-label'], 'Worked for 4s | 1 tool call | 800 input tokens | 120 output tokens')
  deepEqual(elementText(header.props.children), 'Worked for 4s1 tool call800 input tokens120 output tokens')
  deepEqual(elementsWithClass(header.props.children, '__ch4acko3-dsh-turn-fold__separator').length, 3)
  deepEqual(elementsWithClass(header.props.children, '__ch4acko3-dsh-turn-fold__metricValue').map(elementText), ['4', '1', '800', '120'])
  deepEqual(header.props.role, 'status')
  deepEqual(summary.props.children[1].props.className, '__ch4acko3-dsh-turn-fold__rule')
})

test('summary: historical playback uses the projected clock without starting a live timer', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const turn = turnLocation(3, 'open', 1000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'historical-answer', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 1, usage: { inputTokens: 800, outputTokens: 120 } } },
  ]
  const timeline = timelineFrom([turn])
  timeline.playbackClock = { kind: 'historical', time: 5000 }
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline,
    sessionId: 'session-playback',
  }), api, ChatNodeSeat)

  deepEqual(result.map((item) => item.kind), ['seat', 'summary', 'seat'])
  deepEqual(result[1].props.running, false)
  deepEqual(result[1].props.settled, false)
  deepEqual(result[1].props.metrics.startTime, 1000)
  deepEqual(result[1].props.metrics.durationMs, 4000)
  deepEqual(elementText(api.summary(result[1].props).props.children[0].props.children), 'Worked for 4s0 tool calls800 input tokens120 output tokens')
})

test('activity groups: one tool stays native and the second adjacent tool starts a closed group', () => {
  const turn = turnLocation(4, 'open', Date.now() - 2000)
  const oneTool = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'tool-1', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', isError: false } } },
  ]
  const first = buildSandbox()
  const single = classify(first.api.render({
    order: oneTool.map((node) => node.key),
    nodeStore: nodeStoreFrom(oneTool),
    timeline: timelineFrom([turn]),
    sessionId: 'session-tools',
  }), first.api, first.ChatNodeSeat)
  deepEqual(single.map((item) => item.kind), ['seat', 'summary', 'seat'])
  deepEqual(single.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), ['user', 'tool-1'])

  const twoTools = [...oneTool, { key: 'tool-2', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { name: 'bash' } } }]
  const second = buildSandbox()
  const grouped = classify(second.api.render({
    order: twoTools.map((node) => node.key),
    nodeStore: nodeStoreFrom(twoTools),
    timeline: timelineFrom([turn]),
    sessionId: 'session-tools',
  }), second.api, second.ChatNodeSeat)
  deepEqual(grouped.map((item) => item.kind), ['seat', 'summary', 'activity-group'])
  const group = grouped.find((item) => item.kind === 'activity-group')
  deepEqual(group.props.items, [
    { kind: 'tool', key: 'tool-1' },
    { kind: 'tool', key: 'tool-2' },
  ])
  deepEqual(group.props.running, true)
  deepEqual(group.props.failed, 0)
  deepEqual(second.renderCalls, ['user'])
})

test('activity groups: an intervening non-activity Chat node breaks adjacency', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const turn = turnLocation(5, 'open', Date.now() - 2000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'tool-1', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', isError: false } } },
    { key: 'command', kind: 'command', location: { kind: 'step', turn }, data: {} },
    { key: 'tool-2', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', isError: false } } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-tool-boundary',
  }), api, ChatNodeSeat)
  deepEqual(result.filter((item) => item.kind === 'activity-group').length, 0)
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), ['user', 'tool-1', 'command', 'tool-2'])
})

test('activity groups: context injection joins reasoning and tools while keeping its native renderer', () => {
  const { api, ChatNodeSeat, renderCalls } = buildSandbox()
  const turn = turnLocation(6, 'open', Date.now() - 2000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'plan' }] } },
    { key: 'context', kind: 'context', location: { kind: 'step', turn }, data: { content: [], source: {}, provenance: { role: 'system', label: null }, form: null } },
    { key: 'tool', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', isError: false } } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-context-activity',
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'summary', 'activity-group'])
  const group = result[2]
  deepEqual(group.props.items, [
    { kind: 'reasoning', key: 'think:0', text: 'plan' },
    { kind: 'context', key: 'context' },
    { kind: 'tool', key: 'tool' },
  ])
  deepEqual(renderCalls, ['user'])
  const title = api.activityGroup(group.props).props.children[0].props.title
  deepEqual(elementText(title), '1 reasoning step1 context injection1 tool call')
  deepEqual(elementsWithClass(title, '__ch4acko3-dsh-turn-fold-activity__separator').length, 2)
})

test('activity groups: reasoning and its following tools share one closed group while prose stays outside', () => {
  const { api, ChatNodeSeat, renderCalls } = buildSandbox()
  const turn = turnLocation(8, 'open', Date.now() - 2000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'plan' }, { kind: 'text', text: 'checking' }, { kind: 'tool-call', callId: 'call-1' }, { kind: 'tool-call', callId: 'call-2' }] } },
    { key: 'tool-1', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', isError: false } } },
    { key: 'tool-2', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-mixed-activity',
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'summary', 'activity-text', 'activity-group'])
  const group = result[3]
  deepEqual(group.props.items, [
    { kind: 'reasoning', key: 'think:0', text: 'plan' },
    { kind: 'tool', key: 'tool-1' },
    { kind: 'tool', key: 'tool-2' },
  ])
  deepEqual(result[2].child.props.nodeKey, 'think')
  deepEqual(renderCalls, ['user', 'think'])
  const title = api.activityGroup(group.props).props.children[0].props.title
  deepEqual(elementText(title), '1 reasoning step2 tool calls')
  deepEqual(elementsWithClass(title, '__ch4acko3-dsh-turn-fold-activity__separator').length, 1)
})

test('activity groups: visible assistant prose is a hard boundary', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const turn = turnLocation(9, 'open', Date.now() - 2000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'plan' }] } },
    { key: 'tool-1', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
    { key: 'status', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'prepare final response' }, { kind: 'text', text: 'still working' }] } },
    { key: 'tool-2', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-prose-boundary',
  }), api, ChatNodeSeat)
  const groups = result.filter((item) => item.kind === 'activity-group')
  deepEqual(groups.length, 1)
  deepEqual(groups[0].props.items, [
    { kind: 'reasoning', key: 'think:0', text: 'plan' },
    { kind: 'tool', key: 'tool-1' },
  ])
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), ['user', 'status', 'tool-2'])
})

test('activity groups: consecutive reasoning nodes form one closed group', () => {
  const { api, ChatNodeSeat, renderCalls } = buildSandbox()
  const turn = turnLocation(10, 'open', Date.now() - 2000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'think-1', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'one' }] } },
    { key: 'think-2', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'two' }] } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-think-only',
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'summary', 'activity-group'])
  deepEqual(result[2].props.items, [
    { kind: 'reasoning', key: 'think-1:0', text: 'one' },
    { kind: 'reasoning', key: 'think-2:0', text: 'two' },
  ])
  deepEqual(api.activityGroup(result[2].props).props.children[0].props.title, '2 reasoning steps')
  deepEqual(renderCalls, ['user'])
})

test('activity groups: reasoning and tools preserve their original interleaving', () => {
  const { api } = buildSandbox()
  const turn = turnLocation(11, 'open', Date.now() - 2000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    { key: 'tool-1', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', isError: false } } },
    { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'inspect result' }] } },
    { key: 'tool-2', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-interleaved-activity',
  }), api, {})
  deepEqual(result[2].props.items, [
    { kind: 'tool', key: 'tool-1' },
    { kind: 'reasoning', key: 'think:0', text: 'inspect result' },
    { kind: 'tool', key: 'tool-2' },
  ])
})

test('activity groups: failure count is visible without expanding', () => {
  const { api, renderNode } = buildSandbox()
  const group = api.activityGroup({
    failed: 1,
    foldKey: 'activity:session:1:tool-1',
    items: [{ kind: 'tool', key: 'tool-1' }, { kind: 'tool', key: 'tool-2' }],
    renderNode,
    running: false,
    t: () => '',
  })
  deepEqual(group.props['data-state'], 'error')
  deepEqual(group.props['data-dsh-fold-scope'], 'activity-run')
  deepEqual(group.props.children[0].props.title, '2 tool calls')
  deepEqual(elementText(group.props.children[0].props.collapsedContent), '1 failed')
  deepEqual(group.props.children[1].props.className, '__ch4acko3-dsh-turn-fold-activity__clip')
  deepEqual(group.props.children[1].props['aria-hidden'], true)
})

test('summary: the actual upstream duration formatter renders localized time without object coercion', () => {
  const sf = sourceFile('native-duration.js', fs.readFileSync(DSH_012_PATH, 'utf8'))
  const [formatter] = tsquery(sf, 'FunctionDeclaration[name.name="formatRunDuration"]')
  const [pad2] = tsquery(sf, 'FunctionDeclaration[name.name="pad2"]')
  assert.ok(formatter)
  const nativeDuration = new Function(`${pad2 ? pad2.getText(sf) : ''}\n${formatter.getText(sf)}; return formatRunDuration;`)()
  const { api } = buildSandbox(nativeDuration)
  api.setLocale('zh')
  api.setSummaryFields(['duration'])
  const units = { 'duration.hourUnit': '小时', 'duration.minuteUnit': '分', 'duration.secondUnit': '秒' }
  const result = api.summary({ metrics: { durationMs: 84000 }, completed: true, running: false,
    t: (key, params) => units[key] ?? (key === 'duration.minutes' ? `${params.minutes}分${params.seconds}秒` : `${params.seconds}秒`) })
  deepEqual(elementText(result.props.children[0].props.children), '耗时 1 分 24 秒')
})

test('summary: native locale translation distinguishes completed, stopped, and interrupted turns in Chinese', () => {
  const { api } = buildSandbox()
  const completedEnglish = api.summary({
    metrics: { durationMs: 84000 },
    completed: true,
    running: false,
    t: () => '1m 24s',
  })
  deepEqual(elementText(completedEnglish.props.children[0].props.children), 'Took 1m 24s')
  api.setLocale('zh')
  const completed = api.summary({
    metrics: { durationMs: 84000, toolCalls: 2, inputTokens: 3350, outputTokens: 1400, tokenUsagePartial: true },
    completed: true,
    running: false,
    settled: true,
    t: () => '1分24秒',
  })
  deepEqual(elementText(completed.props.children[0].props.children), '耗时 1 分 24 秒2 次工具调用≥ 3.4K 输入 tokens≥ 1.4K 输出 tokens')
  const activityTitle = api.activityGroup({
    failed: 0,
    foldKey: 'activity:session-locale:1:think-1',
    items: [
      { kind: 'reasoning', key: 'think-1:0', text: 'one' },
      { kind: 'reasoning', key: 'think-2:0', text: 'two' },
      { kind: 'tool', key: 'tool-1' },
      { kind: 'tool', key: 'tool-2' },
      { kind: 'tool', key: 'tool-3' },
    ],
    renderNode: () => null,
    running: false,
    t: () => '',
  }).props.children[0].props.title
  deepEqual(elementText(activityTitle), '2 段思考3 次工具调用')
  deepEqual(elementsWithClass(activityTitle, '__ch4acko3-dsh-turn-fold-activity__separator').length, 1)
  for (const [termination, suffix] of [['aborted', '已停止'], ['interrupted', '已中断']]) {
    const summary = api.summary({
      metrics: { durationMs: 84000, toolCalls: 2, inputTokens: 3350, outputTokens: 1400, tokenUsagePartial: true },
      termination,
      running: false,
      settled: true,
      t: () => '1分24秒',
    })
    deepEqual(elementText(summary.props.children[0].props.children), `已工作 1 分 24 秒2 次工具调用≥ 3.4K 输入 tokens≥ 1.4K 输出 tokens - ${suffix}`)
  }
})

test('summary: native settings select and order optional recorded metrics', () => {
  const { api } = buildSandbox()
  api.setSummaryFields(['reasoningTokens', 'cacheReadTokens', 'modelCalls', 'tokensPerSecond'])
  const summary = api.summary({
    metrics: { durationMs: 84000, modelCalls: 2, cacheReadTokens: 300, reasoningTokens: 180, tokensPerSecond: 23.6 },
    running: false,
    t: () => '1m 24s',
  })
  deepEqual(elementText(summary.props.children[0].props.children), '180 reasoning tokens300 cache-read tokens2 model calls24 tokens/s')
  deepEqual(elementsWithClass(summary.props.children[0].props.children, '__ch4acko3-dsh-turn-fold__separator').length, 3)
})

test('summary: partial token totals gain their lower-bound marker only after the turn settles', () => {
  const { api } = buildSandbox()
  api.setSummaryFields(['inputTokens', 'outputTokens'])
  const metrics = { inputTokens: 3350, outputTokens: 1400, tokenUsagePartial: true }
  const running = api.summary({ metrics, running: true, settled: false, t: () => '0s' })
  const replaying = api.summary({ metrics, running: false, settled: false, t: () => '0s' })
  const settled = api.summary({ metrics, running: false, settled: true, t: () => '0s' })
  deepEqual(elementText(running.props.children[0].props.children), '3.4K input tokens1.4K output tokens')
  deepEqual(elementText(replaying.props.children[0].props.children), '3.4K input tokens1.4K output tokens')
  deepEqual(elementText(settled.props.children[0].props.children), '≥ 3.4K input tokens≥ 1.4K output tokens')
})

test('summary: count metrics remount only their numeric value when the count changes', () => {
  const { api } = buildSandbox()
  api.setSummaryFields(['toolCalls'])
  const first = api.summary({ metrics: { toolCalls: 1 }, running: true, t: () => '0s' })
  const second = api.summary({ metrics: { toolCalls: 2 }, running: true, t: () => '0s' })
  const firstValue = elementsWithClass(first, '__ch4acko3-dsh-turn-fold__metricValue')[0]
  const secondValue = elementsWithClass(second, '__ch4acko3-dsh-turn-fold__metricValue')[0]
  deepEqual(firstValue.key, 'toolCalls-1')
  deepEqual(secondValue.key, 'toolCalls-2')
  deepEqual(firstValue.props.children, '1')
  deepEqual(secondValue.props.children, '2')
})

test('summary: elapsed seconds use the same rolling value animation as count metrics', () => {
  const { api } = buildSandbox()
  api.setSummaryFields(['duration'])
  const first = api.summary({ metrics: { durationMs: 1000 }, running: false, completed: true, t: () => '1s' })
  const second = api.summary({ metrics: { durationMs: 2000 }, running: false, completed: true, t: () => '2s' })
  const firstValue = elementsWithClass(first, '__ch4acko3-dsh-turn-fold__metricValue')[0]
  const secondValue = elementsWithClass(second, '__ch4acko3-dsh-turn-fold__metricValue')[0]
  deepEqual(firstValue.key, 'duration-0-1')
  deepEqual(secondValue.key, 'duration-0-2')
  deepEqual(firstValue.props.children, '1')
  deepEqual(secondValue.props.children, '2')
  deepEqual(elementText(second.props.children[0].props.children), 'Took 2s')
})

test('summary: duration units and unchanged minute digits stay still while seconds roll', () => {
  const { api } = buildSandbox()
  api.setSummaryFields(['duration'])
  const first = api.summary({ metrics: { durationMs: 84000 }, running: false, completed: true, t: () => '1m 24s' })
  const second = api.summary({ metrics: { durationMs: 85000 }, running: false, completed: true, t: () => '1m 25s' })
  const firstValues = elementsWithClass(first, '__ch4acko3-dsh-turn-fold__metricValue')
  const secondValues = elementsWithClass(second, '__ch4acko3-dsh-turn-fold__metricValue')
  deepEqual(firstValues.map((value) => value.key), ['duration-0-1', 'duration-2-24'])
  deepEqual(secondValues.map((value) => value.key), ['duration-0-1', 'duration-2-25'])
  deepEqual(firstValues.map(elementText), ['1', '24'])
  deepEqual(secondValues.map(elementText), ['1', '25'])
  deepEqual(elementText(second.props.children[0].props.children), 'Took 1m 25s')
})

test('settings: browser runtime contributes a native plugin-settings card for its namespace', () => {
  const { api } = buildSandbox()
  deepEqual(api.registeredSlots.length, 1)
  deepEqual(api.registeredSlots[0].options, { name: 'settings.plugin.item', key: 'dsh-turn-fold' })
  deepEqual(api.registeredSlots[0].component, api.settingsCard)
})

test('provider: ESM entry resolves its live Config alongside the settings graph', () => {
  const script = `Promise.all([import('@deepseek-ai/dsh-settings'), import('./index.mjs')]).then(([, provider]) => {
    const fields = provider.Config({}).summaryFields.get()
    if (fields.length !== ${DEFAULT_SUMMARY_FIELDS.length}) throw new Error('missing live defaults')
  }).catch(error => { console.error(error); process.exitCode = 1 })`
  const result = spawnSync(process.execPath, ['-e', script], { cwd: ROOT, encoding: 'utf8' })
  deepEqual(result.status, 0, result.stderr || result.stdout)
})

test('settings: rc.2 uses configuration forms and a labelled Plugins tab', () => {
  const api = buildRuntime(React, reactJsxRuntime, true)
  const registration = api.registeredSlots[0]
  deepEqual(registration.options.name, 'settings.plugins.tab')
  deepEqual(registration.options.id, 'dsh-turn-fold')
  deepEqual(registration.options.label(), 'Turn Fold')
  let rendered
  TestRenderer.act(() => { rendered = TestRenderer.create(React.createElement(api.settingsCard)) })
  assert.ok(rendered.toJSON())
  TestRenderer.act(() => { rendered.root.findByType('button').props.onClick() })
  TestRenderer.act(() => { api.setSummaryFields(['duration']) })
  deepEqual(rendered.root.findAllByProps({ 'data-selected': 'true' }).map(tag => tag.props['data-field']), ['duration'])
  TestRenderer.act(() => { rendered.root.findAllByProps({ 'data-selected': 'false' }).find(tag => tag.props['data-field'] === 'reasoningTokens').props.onClick() })
  deepEqual(rendered.root.findAllByProps({ 'data-selected': 'true' }).map(tag => tag.props['data-field']), ['duration', 'reasoningTokens'])
  TestRenderer.act(() => { rendered.unmount() })
})

test('settings: owner link requires a deliberate pointer hover before navigation', () => {
  const api = buildRuntime(React, reactJsxRuntime)
  let rendered
  TestRenderer.act(() => {
    rendered = TestRenderer.create(React.createElement(api.settingsCard))
  })
  const owner = rendered.root.findByType('a')
  const button = rendered.root.findByType('button')
  const realNow = Date.now
  const realSetTimeout = globalThis.setTimeout
  const realClearTimeout = globalThis.clearTimeout
  let now = 1000
  let readyCallback
  const fakeTimer = {}
  Date.now = () => now
  globalThis.setTimeout = (callback, delay) => {
    deepEqual(delay, 300)
    readyCallback = callback
    return fakeTimer
  }
  globalThis.clearTimeout = (timer) => {
    if (timer === fakeTimer) readyCallback = undefined
    else realClearTimeout(timer)
  }
  try {
    TestRenderer.act(() => owner.props.onPointerEnter())
    deepEqual(owner.props['data-ready'], 'false')
    now = 1299
    let prevented = false
    TestRenderer.act(() => owner.props.onClick({ detail: 1, preventDefault() { prevented = true } }))
    deepEqual(prevented, true)
    deepEqual(button.props['aria-expanded'], true)

    TestRenderer.act(() => button.props.onClick())
    now = 1300
    TestRenderer.act(() => readyCallback())
    deepEqual(owner.props['data-ready'], 'true')
    prevented = false
    TestRenderer.act(() => owner.props.onClick({ detail: 1, preventDefault() { prevented = true } }))
    deepEqual(prevented, false)
    deepEqual(button.props['aria-expanded'], false)

    TestRenderer.act(() => owner.props.onPointerLeave())
    deepEqual(owner.props['data-ready'], 'false')
    prevented = false
    TestRenderer.act(() => owner.props.onClick({ detail: 0, preventDefault() { prevented = true } }))
    deepEqual(prevented, false)
    deepEqual(button.props['aria-expanded'], false)
  } finally {
    Date.now = realNow
    globalThis.setTimeout = realSetTimeout
    globalThis.clearTimeout = realClearTimeout
  }
})

test('settings: native card links its owner and persists ordered metric tags', () => {
  const api = buildRuntime(React, reactJsxRuntime)
  let rendered
  TestRenderer.act(() => {
    rendered = TestRenderer.create(React.createElement(api.settingsCard))
  })
  let button = rendered.root.findByType('button')
  deepEqual(button.props['aria-expanded'], false)
  const owner = rendered.root.findByType('a')
  deepEqual(owner.children.join(''), '@ch4acko3/dsh-turn-fold')
  deepEqual(owner.parent.props.className, '__ch4acko3-dsh-turn-fold-settings__titleRow')
  deepEqual(owner.props.href, 'https://github.com/memorax-ai/dsh-turn-fold')
  deepEqual(owner.props.target, '_blank')
  deepEqual(owner.props.rel, 'noreferrer')
  deepEqual(rendered.root.findByProps({ 'data-test-settings-chevron': '' }).props.className, '__ch4acko3-dsh-turn-fold-settings__chevron')

  TestRenderer.act(() => button.props.onClick())
  assert.match(rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold-settings': '' }).props.className, /__ch4acko3-dsh-turn-fold-settings--open/)
  deepEqual(rendered.root.findAllByProps({ className: '__ch4acko3-dsh-turn-fold-settings__dropDivider' }).length, 0)
  let selected = rendered.root.findAllByProps({ 'data-selected': 'true' })
  let available = rendered.root.findAllByProps({ 'data-selected': 'false' })
  deepEqual(selected.map((tag) => tag.props['data-field']), DEFAULT_SUMMARY_FIELDS)
  deepEqual(available.map((tag) => tag.props['data-field']), SUMMARY_FIELDS.filter((field) => !DEFAULT_SUMMARY_FIELDS.includes(field)))

  const reasoning = available.find((tag) => tag.props['data-field'] === 'reasoningTokens')
  TestRenderer.act(() => reasoning.props.onClick())
  selected = rendered.root.findAllByProps({ 'data-selected': 'true' })
  deepEqual(selected.map((tag) => tag.props['data-field']), [...DEFAULT_SUMMARY_FIELDS, 'reasoningTokens'])

  let input = selected.find((tag) => tag.props['data-field'] === 'inputTokens')
  TestRenderer.act(() => input.props.onKeyDown({ altKey: true, key: 'ArrowLeft', preventDefault() {} }))
  input = rendered.root.findAllByProps({ 'data-selected': 'true' }).find((tag) => tag.props['data-field'] === 'inputTokens')
  TestRenderer.act(() => input.props.onKeyDown({ altKey: true, key: 'ArrowLeft', preventDefault() {} }))
  selected = rendered.root.findAllByProps({ 'data-selected': 'true' })
  deepEqual(selected.map((tag) => tag.props['data-field']), ['inputTokens', 'duration', 'toolCalls', 'outputTokens', 'reasoningTokens'])

  TestRenderer.act(() => api.setSummaryFields([]))
  const slot = rendered.root.findByProps({ className: '__ch4acko3-dsh-turn-fold-settings__slot' })
  deepEqual(slot.props['data-empty'], 'true')
  deepEqual(slot.findByProps({ className: '__ch4acko3-dsh-turn-fold-settings__empty' }).children.join(''), 'No metrics will be shown')

  TestRenderer.act(() => rendered.unmount())
})

test('settings: wrapped tag hit testing projects an exact insertion index', () => {
  const api = buildRuntime(React, reactJsxRuntime)
  const bounds = [
    { top: 0, bottom: 28, left: 0, width: 60 },
    { top: 0, bottom: 28, left: 68, width: 80 },
    { top: 36, bottom: 64, left: 0, width: 72 },
    { top: 36, bottom: 64, left: 80, width: 64 },
  ]
  deepEqual(api.insertionIndex(bounds, -5, 12), 0)
  deepEqual(api.insertionIndex(bounds, 50, 12), 1)
  deepEqual(api.insertionIndex(bounds, 200, 12), 2)
  deepEqual(api.insertionIndex(bounds, 10, 32), 2)
  deepEqual(api.insertionIndex(bounds, 120, 48), 4)
  deepEqual(api.insertionIndex(bounds, 10, 80), 2)
  deepEqual(api.insertionIndex(bounds, 50, -1000), 1)
  deepEqual(api.insertionIndex(bounds, 120, 1000), 4)
  deepEqual(api.dropDestination(100, -1000), 'selected')
  deepEqual(api.dropDestination(100, 100), 'selected')
  deepEqual(api.dropDestination(100, 101), 'available')
  deepEqual(api.dropDestination(100, 1000), 'available')
})

test('metrics: records native usage and timing fields even when they are not displayed', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  fixture.nodes.find((node) => node.key === 'think').data.finalNode.timing = {
    stepStartTime: 1100,
    firstTokenTime: 1500,
    completedTime: 11500,
  }
  fixture.nodes.find((node) => node.key === 'answer').data.finalNode.timing = {
    stepStartTime: 12000,
    firstTokenTime: 13000,
    completedTime: 22000,
  }
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-metrics',
  }), api, ChatNodeSeat)
  const metrics = result.find((item) => item.kind === 'disclosure').props.metrics
  deepEqual(metrics.timeToFirstToken, 400)
  deepEqual(metrics.tokensPerSecond, 1400 / 19)
})

test('rendering: the original node renderer handles every visible and expanded node exactly once', () => {
  const { api, renderCalls } = buildSandbox()
  const fixture = completedFixture()
  const out = api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-renderer',
  })
  deepEqual(renderCalls, ['user', 'steering', 'answer', 'tail'])

  const disclosureElement = out.find((element) => element.type === api.disclosure)
  const closed = api.disclosure(disclosureElement.props)
  closed.props.children[0].props.onClick()
  const opened = api.disclosure(disclosureElement.props)
  deepEqual(renderCalls, ['user', 'steering', 'answer', 'tail', 'think', 'tool-1', 'tool-2'])
  opened.props.children[0].props.onClick()
})

test('fold: branch-unavailable turn remains fully visible', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture({ branchUnavailable: true })
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  deepEqual(result.filter((item) => item.kind === 'summary').length, 1)
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), fixture.order)
})

test('fold: known activity after the closing answer disables folding', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  const tailIndex = fixture.order.indexOf('tail')
  const after = { key: 'tool-after-answer', kind: 'tool-call', location: { kind: 'step', turn: fixture.turn }, data: { root: {} } }
  fixture.nodes.splice(tailIndex, 0, after)
  fixture.order.splice(tailIndex, 0, after.key)
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  deepEqual(result.filter((item) => item.kind === 'summary').length, 1)
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), fixture.order)
})

test('summary: activity appended after the closing answer keeps the bar at the turn start', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const turn = turnLocation(6, 'closed', 1000, 5000)
  const nodes = [
    { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
    {
      key: 'answer',
      kind: 'assistant-step',
      location: { kind: 'step', turn },
      data: {
        step: 1,
        blocks: [{ kind: 'text', text: 'starting background work' }],
        finalNode: { seq: 20 },
        usage: { inputTokens: 100, outputTokens: 50 },
      },
    },
    { key: 'tail', kind: 'turn-tail', location: { kind: 'turn', turn }, data: { closing: { finalNode: { seq: 20 } } } },
    { key: 'tool-1', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
    { key: 'tool-2', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
  ]
  const result = classify(api.render({
    order: nodes.map((node) => node.key),
    nodeStore: nodeStoreFrom(nodes),
    timeline: timelineFrom([turn]),
    sessionId: 'session-background-tools',
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'summary', 'seat', 'seat', 'activity-group'])
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), ['user', 'answer', 'tail'])
  deepEqual(result.find((item) => item.kind === 'activity-group').props.items, [
    { kind: 'tool', key: 'tool-1' },
    { kind: 'tool', key: 'tool-2' },
  ])
})

test('fold: an unknown node after the closing answer also disables folding', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  const tailIndex = fixture.order.indexOf('tail')
  const unknown = { key: 'after-answer', kind: 'unknown', location: { kind: 'turn', turn: fixture.turn }, data: {} }
  fixture.nodes.splice(tailIndex, 0, unknown)
  fixture.order.splice(tailIndex, 0, unknown.key)
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  deepEqual(result.filter((item) => item.kind === 'summary').length, 1)
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), fixture.order)
})

test('fold: a closing-less completed turn remains fully visible', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  fixture.nodes.find((node) => node.key === 'tail').data.closing = null
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  deepEqual(result.filter((item) => item.kind === 'summary').length, 1)
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), fixture.order)
})

test('fold: a max-token turn remains fully visible', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  const tailIndex = fixture.order.indexOf('tail')
  const maxTokens = { key: 'max-tokens', kind: 'turn-max-tokens', location: { kind: 'turn', turn: fixture.turn }, data: {} }
  fixture.nodes.splice(tailIndex, 0, maxTokens)
  fixture.order.splice(tailIndex, 0, maxTokens.key)
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  deepEqual(result.filter((item) => item.kind === 'summary').length, 1)
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), fixture.order)
})

test('fold: every declared Agent activity kind joins the disclosure', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  const answerIndex = fixture.order.indexOf('answer')
  const kinds = ['context', 'command', 'manual-compaction', 'compaction', 'model-retry']
  const extra = kinds.map((kind) => ({ key: `activity-${kind}`, kind, location: { kind: 'step', turn: fixture.turn }, data: {} }))
  fixture.nodes.splice(answerIndex, 0, ...extra)
  fixture.order.splice(answerIndex, 0, ...extra.map((node) => node.key))
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  const disclosure = result.find((item) => item.kind === 'disclosure')
  deepEqual(disclosure.props.activity, ['think', 'tool-1', 'tool-2', ...extra.map((node) => node.key)])
})

test('fold: incomplete timeline suppresses metrics instead of showing partial counts', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  const incomplete = { ...fixture.turn, start: undefined }
  for (const node of fixture.nodes) {
    if (node.location.kind === 'step' || node.location.kind === 'turn') node.location = { ...node.location, turn: incomplete }
  }
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([incomplete]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  const disclosure = result.find((item) => item.kind === 'disclosure')
  deepEqual(disclosure.props.metrics.durationMs, null)
  deepEqual(disclosure.props.metrics.toolCalls, 2)
  deepEqual(disclosure.props.metrics.outputTokens, 1400)
})

test('fold: missing usage preserves the confirmed token lower bound', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  fixture.nodes.find((node) => node.key === 'think').data.usage = undefined
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  const metrics = result.find((item) => item.kind === 'disclosure').props.metrics
  deepEqual(metrics.inputTokens, 2150)
  deepEqual(metrics.outputTokens, 900)
  deepEqual(metrics.tokenUsagePartial, true)
})

test('fold: missing closing usage preserves the earlier confirmed token lower bound', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  fixture.nodes.find((node) => node.key === 'answer').data.usage = undefined
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-a',
  }), api, ChatNodeSeat)
  const metrics = result.find((item) => item.kind === 'disclosure').props.metrics
  deepEqual(metrics.inputTokens, 1200)
  deepEqual(metrics.outputTokens, 500)
  deepEqual(metrics.tokenUsagePartial, true)
})

for (const endReason of ['aborted', 'interrupted']) {
test(`fold: ${endReason} turn folds and labels confirmed usage as a lower bound`, () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  const interrupted = turnLocation(1, 'closed', 1000, 85000, endReason)
  fixture.nodes.find((node) => node.key === 'answer').data.usage = undefined
  for (const node of fixture.nodes) {
    if (node.location.kind === 'step' || node.location.kind === 'turn') node.location = { ...node.location, turn: interrupted }
  }
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([interrupted]),
    sessionId: `session-${endReason}`,
  }), api, ChatNodeSeat)
  deepEqual(result.map((item) => item.kind), ['seat', 'seat', 'disclosure', 'seat', 'seat'])
  deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), ['user', 'steering', 'answer', 'tail'])
  const disclosureProps = result.find((item) => item.kind === 'disclosure').props
  deepEqual(disclosureProps.activity, ['think', 'tool-1', 'tool-2'])
  deepEqual(disclosureProps.metrics.inputTokens, 1200)
  deepEqual(disclosureProps.metrics.outputTokens, 500)
  deepEqual(disclosureProps.metrics.tokenUsagePartial, true)

  const disclosure = api.disclosure(disclosureProps)
  const button = disclosure.props.children[0]
  const suffix = endReason === 'aborted' ? 'Stopped' : 'Interrupted'
  deepEqual(button.props['aria-label'], `Expand agent activity: Worked for 1m 24s | 2 tool calls | ≥ 1.2K input tokens | ≥ 500 output tokens - ${suffix}`)
  deepEqual(elementText(button.props.children), `Worked for 1m 24s2 tool calls≥ 1.2K input tokens≥ 500 output tokens - ${suffix}`)
  deepEqual(button.props.children.props.children.at(-1).type, api.chevron)
  deepEqual(elementsWithClass(button.props.children, '__ch4acko3-dsh-turn-fold__metricValue').map(elementText), ['1', '24', '2', '1.2K', '500'])
})
}

test('fold: no usage samples keeps token totals hidden', () => {
  const { api, ChatNodeSeat } = buildSandbox()
  const fixture = completedFixture()
  fixture.nodes.find((node) => node.key === 'think').data.usage = undefined
  fixture.nodes.find((node) => node.key === 'answer').data.usage = undefined
  const result = classify(api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-no-usage',
  }), api, ChatNodeSeat)
  const metrics = result.find((item) => item.kind === 'disclosure').props.metrics
  deepEqual(metrics.inputTokens, null)
  deepEqual(metrics.outputTokens, null)
  deepEqual(metrics.tokenUsagePartial, false)
})

for (const [name, status, reason] of [
  ['failed', 'closed', 'error'],
  ['open', 'open', undefined],
]) {
  test(`fold: ${name} turn remains fully visible`, () => {
    const { api, ChatNodeSeat } = buildSandbox()
    const fixture = completedFixture()
    const changed = turnLocation(1, status, 1000, status === 'closed' ? 85000 : undefined, reason)
    for (const node of fixture.nodes) {
      if (node.location.kind === 'step' || node.location.kind === 'turn') node.location = { ...node.location, turn: changed }
    }
    const result = classify(api.render({
      order: fixture.order,
      nodeStore: nodeStoreFrom(fixture.nodes),
      timeline: timelineFrom([changed]),
      sessionId: 'session-a',
    }), api, ChatNodeSeat)
    deepEqual(result.filter((item) => item.kind === 'summary').length, 1)
    deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), fixture.order)
  })
}

test('disclosure: accessible control, ownership, and open state survive remounts', () => {
  const { api, renderNode } = buildSandbox()
  const props = {
    activity: ['think'],
    metrics: { durationMs: 84000, toolCalls: 1, inputTokens: 2000, outputTokens: 1400 },
    foldKey: 'session-persist:7',
    nodeStore: nodeStoreFrom([{ key: 'think', kind: 'assistant-step', data: {} }]),
    orderPositions: new Map([['think', 0]]),
    renderNode,
    sessionId: 'session-persist',
    t: () => '1m 24s',
  }
  const closed = api.disclosure(props)
  const closedButton = closed.props.children[0]
  deepEqual(closedButton.props['aria-expanded'], false)
  assert.match(closedButton.props['aria-label'], /^Expand agent activity:/)
  assert.ok(closedButton.props['aria-controls'])
  assert.match(closedButton.props['aria-controls'], /^ch4acko3-dsh-turn-fold-body-/)
  const summaryChildren = closedButton.props.children.props.children
  deepEqual(summaryChildren.at(-1).type, api.chevron)
  deepEqual(summaryChildren.at(-1).key, 'chevron')
  deepEqual(closed.props['data-ch4acko3-dsh-turn-fold'], '')
  deepEqual(closed.props['data-dsh-fold-owner'], '@ch4acko3/dsh-turn-fold')
  deepEqual(closed.props['data-dsh-fold-scope'], 'turn')
  deepEqual(closed.props['data-dsh-fold-keys'], '["think"]')
  deepEqual(closed.props.children[1].props.className, '__ch4acko3-dsh-turn-fold__rule')
  deepEqual(closed.props.children[2].props['aria-hidden'], true)
  deepEqual(closed.props.children[2].props.children, null)
  closedButton.props.onClick()

  const reopened = api.disclosure(props)
  const reopenedButton = reopened.props.children[0]
  deepEqual(reopenedButton.props['aria-expanded'], true)
  assert.match(reopenedButton.props['aria-label'], /^Collapse agent activity:/)
  deepEqual(reopened.props['data-ch4acko3-dsh-turn-fold-open'], 'true')
  deepEqual(reopened.props.children[2].props.inert, false)
})

test('disclosure: adjacent tools stay nested in a closed group when the turn opens', () => {
  const { api, renderCalls } = buildSandbox()
  const fixture = completedFixture()
  fixture.nodes = fixture.nodes.filter((node) => node.key !== 'steering')
  fixture.order = fixture.order.filter((key) => key !== 'steering')
  const out = api.render({
    order: fixture.order,
    nodeStore: nodeStoreFrom(fixture.nodes),
    timeline: timelineFrom([fixture.turn]),
    sessionId: 'session-nested-tools',
  })
  const disclosureElement = out.find((element) => element.type === api.disclosure)
  const closed = api.disclosure(disclosureElement.props)
  closed.props.children[0].props.onClick()
  const opened = api.disclosure(disclosureElement.props)
  const groups = elementsOfType(opened, api.activityGroup)
  deepEqual(groups.length, 1)
  deepEqual(groups[0].props.items, [
    { kind: 'tool', key: 'tool-1' },
    { kind: 'tool', key: 'tool-2' },
  ])
  deepEqual(renderCalls, ['user', 'answer', 'tail', 'think'])
})

test('activity groups: an opened reasoning-and-tool group stays open as more tools arrive', () => {
  function Seat({ nodeKey }) {
    return React.createElement('div', { 'data-seat': nodeKey })
  }
  const api = buildRuntime(React, reactJsxRuntime)
  const baseProps = {
    failed: 0,
    foldKey: 'activity:session-growth:1:think-1',
    items: [{ kind: 'reasoning', key: 'think-1:0', text: 'plan' }, { kind: 'tool', key: 'tool-1' }],
    nodeKeys: ['think-1', 'tool-1'],
    renderNode: (key) => React.createElement(Seat, { nodeKey: key, key }),
    running: true,
    t: () => '',
  }
  let rendered
  TestRenderer.act(() => {
    rendered = TestRenderer.create(React.createElement(api.activityGroup, baseProps))
  })
  let button = rendered.root.findByType('button')
  deepEqual(rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold-activity': '' }).props['data-dsh-fold-keys'], '["think-1","tool-1"]')
  deepEqual(button.props['aria-expanded'], false)
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'tool-1' }).length, 0)

  TestRenderer.act(() => button.props.onClick())
  button = rendered.root.findByType('button')
  deepEqual(button.props['aria-expanded'], true)
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'tool-1' }).length, 1)

  TestRenderer.act(() => {
    rendered.update(React.createElement(api.activityGroup, {
      ...baseProps,
      items: [
        { kind: 'reasoning', key: 'think-1:0', text: 'plan' },
        { kind: 'tool', key: 'tool-1' },
        { kind: 'reasoning', key: 'think-2:0', text: 'inspect result' },
        { kind: 'tool', key: 'tool-2' },
      ],
      nodeKeys: ['think-1', 'tool-1', 'think-2', 'tool-2'],
    }))
  })
  button = rendered.root.findByType('button')
  deepEqual(rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold-activity': '' }).props['data-dsh-fold-keys'], '["think-1","tool-1","think-2","tool-2"]')
  deepEqual(button.props['aria-expanded'], true)
  deepEqual(elementText(button.props.children), '2 reasoning steps2 tool calls')
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'tool-2' }).length, 1)
  deepEqual(rendered.root.findAllByProps({ 'data-test-reasoning': 'inspect result' }).length, 1)

  TestRenderer.act(() => rendered.unmount())
})

test('activity groups: opened context survives leading reasoning and turn completion regrouping', () => {
  function Seat({ nodeKey }) {
    return React.createElement('div', { 'data-seat': nodeKey })
  }
  const api = buildRuntime(React, reactJsxRuntime)
  const openTurn = turnLocation(13, 'open', Date.now() - 2000)
  const closedTurn = turnLocation(13, 'closed', openTurn.start.time, Date.now())
  function nodesFor(turn, reasoning, complete) {
    const nodes = [
      { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
      { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: reasoning ? [{ kind: 'reasoning', text: 'plan' }] : [] } },
      { key: 'context', kind: 'context', location: { kind: 'step', turn }, data: {} },
      { key: 'tool', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
      { key: 'answer', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'text', text: 'done' }], finalNode: { seq: 20 } } },
    ]
    if (complete) nodes.push({ key: 'tail', kind: 'turn-tail', location: { kind: 'turn', turn }, data: { closing: { finalNode: { seq: 20 } } } })
    return nodes
  }
  function Chat({ nodes, turn }) {
    return api.render({
      order: nodes.map((node) => node.key),
      nodeStore: nodeStoreFrom(nodes),
      timeline: timelineFrom([turn]),
      sessionId: 'session-context-regroup',
      renderNode: (key) => React.createElement(Seat, { nodeKey: key, key }),
      t: () => '',
    })
  }
  withGlobals({ matchMedia: () => ({ matches: true }) }, () => {
    let rendered
    TestRenderer.act(() => {
      rendered = TestRenderer.create(React.createElement(Chat, { nodes: nodesFor(openTurn, false, false), turn: openTurn }))
    })
    let activity = rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold-activity': '' })
    deepEqual(activity.props['data-dsh-fold-keys'], '["context","tool"]')
    TestRenderer.act(() => activity.findByType('button').props.onClick())
    deepEqual(rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold-activity': '' }).props['data-ch4acko3-dsh-turn-fold-activity-open'], 'true')

    TestRenderer.act(() => {
      rendered.update(React.createElement(Chat, { nodes: nodesFor(openTurn, true, false), turn: openTurn }))
    })
    activity = rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold-activity': '' })
    deepEqual(activity.props['data-dsh-fold-keys'], '["think","context","tool"]')
    deepEqual(activity.props['data-ch4acko3-dsh-turn-fold-activity-open'], 'true')

    TestRenderer.act(() => {
      rendered.update(React.createElement(Chat, { nodes: nodesFor(closedTurn, true, true), turn: closedTurn }))
    })
    const turnFold = rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold': '' })
    deepEqual(turnFold.props['data-ch4acko3-dsh-turn-fold-open'], 'false')
    TestRenderer.act(() => turnFold.findByType('button').props.onClick())
    activity = rendered.root.findByProps({ 'data-ch4acko3-dsh-turn-fold-activity': '' })
    deepEqual(activity.props['data-dsh-fold-keys'], '["think","context","tool"]')
    deepEqual(activity.props['data-ch4acko3-dsh-turn-fold-activity-open'], 'true')
    TestRenderer.act(() => rendered.unmount())
  })
})

test('activity groups: expanded context injection uses the native node renderer', () => {
  function Seat({ nodeKey }) {
    return React.createElement('div', { 'data-seat': nodeKey })
  }
  const api = buildRuntime(React, reactJsxRuntime)
  const props = {
    failed: 0,
    foldKey: 'activity:session-context-renderer:1:think',
    items: [
      { kind: 'reasoning', key: 'think:0', text: 'plan' },
      { kind: 'context', key: 'context' },
    ],
    nodeKeys: ['think', 'context'],
    renderNode: (key) => React.createElement(Seat, { nodeKey: key, key }),
    running: false,
    t: () => '',
  }
  let rendered
  TestRenderer.act(() => {
    rendered = TestRenderer.create(React.createElement(api.activityGroup, props))
  })
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'context' }).length, 0)

  TestRenderer.act(() => rendered.root.findByType('button').props.onClick())
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'context' }).length, 1)
  deepEqual(rendered.root.findAllByProps({ 'data-test-reasoning': 'plan' }).length, 1)

  TestRenderer.act(() => rendered.unmount())
})

test('activity groups: closing animates before the mounted body is removed', () => {
  function Seat({ nodeKey }) {
    return React.createElement('div', { 'data-seat': nodeKey })
  }
  const api = buildRuntime(React, reactJsxRuntime)
  const props = {
    failed: 0,
    foldKey: 'activity:session-motion:1:tool-1',
    items: [{ kind: 'tool', key: 'tool-1' }, { kind: 'tool', key: 'tool-2' }],
    nodeKeys: ['tool-1', 'tool-2'],
    renderNode: (key) => React.createElement(Seat, { nodeKey: key, key }),
    running: false,
    t: () => '',
  }
  let rendered
  TestRenderer.act(() => {
    rendered = TestRenderer.create(React.createElement(api.activityGroup, props))
  })
  let button = rendered.root.findByType('button')
  TestRenderer.act(() => button.props.onClick())
  let clip = rendered.root.findByProps({ className: '__ch4acko3-dsh-turn-fold-activity__clip' })
  deepEqual(clip.props['aria-hidden'], false)
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'tool-1' }).length, 1)

  let finishExit
  withGlobals({
    setTimeout(callback, delay) {
      deepEqual(delay, 180)
      finishExit = callback
      return 1
    },
  }, () => {
    TestRenderer.act(() => button.props.onClick())
  })
  clip = rendered.root.findByProps({ className: '__ch4acko3-dsh-turn-fold-activity__clip' })
  deepEqual(clip.props['aria-hidden'], true)
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'tool-1' }).length, 1)

  TestRenderer.act(() => finishExit())
  deepEqual(rendered.root.findAllByProps({ 'data-seat': 'tool-1' }).length, 0)
  TestRenderer.act(() => rendered.unmount())
})

test('disclosures: expanded bodies release overflow only after motion completes', () => {
  function Seat({ nodeKey }) {
    return React.createElement('div', { 'data-seat': nodeKey })
  }
  const api = buildRuntime(React, reactJsxRuntime)
  const cases = [
    {
      component: api.activityGroup,
      bodyWrapClass: '__ch4acko3-dsh-turn-fold-activity__bodyWrap',
      visibleClass: '__ch4acko3-dsh-turn-fold-activity__bodyWrap--overflow-visible',
      props: {
        failed: 0,
        foldKey: 'activity:session-overflow:1:tool-1',
        items: [{ kind: 'tool', key: 'tool-1' }, { kind: 'tool', key: 'tool-2' }],
        nodeKeys: ['tool-1', 'tool-2'],
        renderNode: (key) => React.createElement(Seat, { nodeKey: key, key }),
        running: false,
        t: () => '',
      },
    },
    {
      component: api.disclosure,
      bodyWrapClass: '__ch4acko3-dsh-turn-fold__bodyWrap',
      visibleClass: '__ch4acko3-dsh-turn-fold__bodyWrap--overflow-visible',
      props: {
        activity: ['think'],
        closingReasoning: [],
        metrics: { durationMs: 1000, toolCalls: 0 },
        foldKey: 'session-overflow:1',
        nodeStore: nodeStoreFrom([{ key: 'think', kind: 'assistant-step', data: {} }]),
        orderPositions: new Map([['think', 0]]),
        renderNode: (key) => React.createElement(Seat, { nodeKey: key, key }),
        sessionId: 'session-overflow',
        t: () => '1s',
      },
    },
  ]

  for (const candidate of cases) {
    let nextFrame
    const timers = []
    withGlobals({
      matchMedia: () => ({ matches: false }),
      requestAnimationFrame(callback) {
        nextFrame = callback
        return 1
      },
      cancelAnimationFrame() {},
      setTimeout(callback, delay) {
        deepEqual(delay, 180)
        timers.push(callback)
        return timers.length
      },
      clearTimeout() {},
    }, () => {
      let rendered
      TestRenderer.act(() => {
        rendered = TestRenderer.create(React.createElement(candidate.component, candidate.props))
      })
      let button = rendered.root.findByType('button')
      TestRenderer.act(() => button.props.onClick())

      let bodyWrap = rendered.root.find((node) => node.props.className === candidate.bodyWrapClass)
      deepEqual(button.props['aria-expanded'], false)
      assert.doesNotMatch(bodyWrap.props.className, new RegExp(candidate.visibleClass))

      TestRenderer.act(() => nextFrame())
      button = rendered.root.findByType('button')
      bodyWrap = rendered.root.find((node) => node.props.className === candidate.bodyWrapClass)
      deepEqual(button.props['aria-expanded'], true)
      assert.doesNotMatch(bodyWrap.props.className, new RegExp(candidate.visibleClass))

      TestRenderer.act(() => timers.shift()())
      bodyWrap = rendered.root.find((node) => typeof node.props.className === 'string' && node.props.className.includes(candidate.bodyWrapClass))
      assert.match(bodyWrap.props.className, new RegExp(candidate.visibleClass))

      TestRenderer.act(() => button.props.onClick())
      bodyWrap = rendered.root.find((node) => node.props.className === candidate.bodyWrapClass)
      deepEqual(button.props['aria-expanded'], false)
      assert.doesNotMatch(bodyWrap.props.className, new RegExp(candidate.visibleClass))

      TestRenderer.act(() => timers.shift()())
      deepEqual(rendered.root.findAll((node) => typeof node.props.className === 'string' && node.props.className.includes(candidate.bodyWrapClass)).length, 0)
      TestRenderer.act(() => rendered.unmount())
    })
  }
})

test('disclosure: real React state opens and closes the mounted body', () => {
  function Seat({ nodeKey }) {
    return React.createElement('div', { 'data-seat': nodeKey })
  }
  const api = buildRuntime(React, reactJsxRuntime)
  const props = {
    activity: ['think'],
    closingReasoning: ['closing thought'],
    metrics: { durationMs: 84000, toolCalls: 1, inputTokens: 2000, outputTokens: 1400 },
    foldKey: 'session-react:1',
    nodeStore: nodeStoreFrom([{ key: 'think', kind: 'assistant-step', data: {} }]),
    orderPositions: new Map([['think', 0]]),
    renderNode: (key) => React.createElement(Seat, { nodeKey: key, key }),
    sessionId: 'session-react',
    t: () => '1m 24s',
  }
  withGlobals({ matchMedia: () => ({ matches: true }) }, () => {
    let rendered
    TestRenderer.act(() => {
      rendered = TestRenderer.create(React.createElement(api.disclosure, props))
    })
    let button = rendered.root.findByType('button')
    deepEqual(button.props['aria-expanded'], false)

    TestRenderer.act(() => button.props.onClick())
    button = rendered.root.findByType('button')
    deepEqual(button.props['aria-expanded'], true)
    assert.match(rendered.root.find((node) => typeof node.props.className === 'string' && node.props.className.includes('__ch4acko3-dsh-turn-fold__bodyWrap')).props.className, /__ch4acko3-dsh-turn-fold__bodyWrap--overflow-visible/)
    deepEqual(rendered.root.findAllByProps({ 'data-seat': 'think' }).length, 1)
    deepEqual(rendered.root.findAllByProps({ 'data-test-reasoning': 'closing thought' }).length, 1)

    TestRenderer.act(() => button.props.onClick())
    button = rendered.root.findByType('button')
    deepEqual(button.props['aria-expanded'], false)
    deepEqual(rendered.root.findAllByProps({ 'data-seat': 'think' }).length, 0)
    deepEqual(rendered.root.findAllByProps({ 'data-test-reasoning': 'closing thought' }).length, 0)

    TestRenderer.act(() => rendered.unmount())
  })
})

test('helpers: token usage reader totals billed input and rejects invalid usage', () => {
  const { api } = buildSandbox()
  deepEqual(api.usage({ inputTokens: 100, outputTokens: 50, cacheReadTokens: 20, cacheWriteTokens: 10, reasoningTokens: 5 }), {
    inputTokens: 130,
    outputTokens: 50,
    cacheReadTokens: 20,
    cacheWriteTokens: 10,
    reasoningTokens: 5,
  })
  deepEqual(api.usage({ inputTokens: 100, outputTokens: -1 }), null)
  deepEqual(api.usage({ inputTokens: '100', outputTokens: 50 }), null)
  deepEqual(api.usage(null), null)
})

function withGlobals(values, fn) {
  const previous = new Map()
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, Object.hasOwn(globalThis, key) ? { value: globalThis[key] } : null)
    globalThis[key] = value
  }
  try {
    return fn()
  } finally {
    for (const [key, value] of previous) {
      if (value === null) delete globalThis[key]
      else globalThis[key] = value.value
    }
  }
}

class FakeElement {
  constructor(key, parentElement = null) {
    this.dataset = key === null ? {} : { chatAnchorKey: key }
    this.parentElement = parentElement
  }

  closest() {
    for (let element = this; element !== null; element = element.parentElement) {
      if (element.dataset.chatAnchorKey) return element
    }
    return null
  }
}

test('interaction: a selection crossing activity keeps every intersected row open', () => {
  const thinkRow = new FakeElement('think')
  const answerRow = new FakeElement('answer')
  const selection = {
    isCollapsed: false,
    anchorNode: { nodeType: 3, parentElement: answerRow },
    focusNode: { nodeType: 3, parentElement: thinkRow },
    rangeCount: 1,
    getRangeAt() {
      return { intersectsNode: (node) => node === thinkRow || node === answerRow }
    },
  }
  withGlobals({
    Element: FakeElement,
    document: {
      activeElement: null,
      documentElement: { lang: 'en' },
      head: { appendChild() {} },
      getElementById: () => ({}),
      querySelectorAll: () => [thinkRow, answerRow],
    },
    window: { getSelection: () => selection },
  }, () => {
    const { api, ChatNodeSeat } = buildSandbox()
    deepEqual([...api.interactionKeys()], ['think', 'answer'])
    const fixture = completedFixture()
    const result = classify(api.render({
      order: fixture.order,
      nodeStore: nodeStoreFrom(fixture.nodes),
      timeline: timelineFrom([fixture.turn]),
      sessionId: 'session-a',
    }), api, ChatNodeSeat)
    deepEqual(result.filter((item) => item.kind === 'summary').length, 1)
    deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), fixture.order)
  })
})

test('interaction: selecting visible context inside an open turn keeps the turn disclosure mounted', () => {
  const contextRow = new FakeElement('context')
  const selection = {
    isCollapsed: true,
    rangeCount: 0,
    getRangeAt() {
      return { intersectsNode: (node) => node === contextRow }
    },
  }
  withGlobals({
    Element: FakeElement,
    document: {
      activeElement: null,
      documentElement: { lang: 'en' },
      head: { appendChild() {} },
      getElementById: () => ({}),
      querySelectorAll: () => [contextRow],
    },
    window: { getSelection: () => selection },
  }, () => {
    const { api, ChatNodeSeat } = buildSandbox()
    const turn = turnLocation(13, 'closed', 1000, 5000)
    const nodes = [
      { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
      { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 1, blocks: [{ kind: 'reasoning', text: 'plan' }], finalNode: { seq: 10 } } },
      { key: 'context', kind: 'context', location: { kind: 'step', turn }, data: { content: [{ type: 'text', text: 'visible context' }] } },
      { key: 'answer', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 2, blocks: [{ kind: 'text', text: 'done' }], finalNode: { seq: 20 } } },
      { key: 'tail', kind: 'turn-tail', location: { kind: 'turn', turn }, data: { closing: { finalNode: { seq: 20 } } } },
    ]
    const props = {
      order: nodes.map((node) => node.key),
      nodeStore: nodeStoreFrom(nodes),
      timeline: timelineFrom([turn]),
      sessionId: 'session-visible-context-selection',
    }
    const initial = api.render(props)
    const disclosureElement = initial.find((element) => element.type === api.disclosure)
    assert.ok(disclosureElement)
    api.disclosure(disclosureElement.props).props.children[0].props.onClick()

    selection.isCollapsed = false
    selection.rangeCount = 1
    const updated = classify(api.render(props), api, ChatNodeSeat)
    deepEqual(updated.filter((item) => item.kind === 'disclosure').length, 1)
    deepEqual(updated.filter((item) => item.kind === 'summary').length, 0)
    const remounted = api.disclosure(updated.find((item) => item.kind === 'disclosure').props)
    deepEqual(remounted.props.children[0].props['aria-expanded'], true)
  })
})

test('interaction: selecting a promoted image result does not unfold its completed turn', () => {
  const imageRow = new FakeElement('tool-img')
  const selection = {
    isCollapsed: false,
    rangeCount: 1,
    getRangeAt() {
      return { intersectsNode: (node) => node === imageRow }
    },
  }
  withGlobals({
    Element: FakeElement,
    document: {
      activeElement: null,
      documentElement: { lang: 'en' },
      head: { appendChild() {} },
      getElementById: () => ({}),
      querySelectorAll: () => [imageRow],
    },
    window: { getSelection: () => selection },
  }, () => {
    const { api, ChatNodeSeat } = buildSandbox()
    const turn = turnLocation(14, 'closed', 1000, 5000)
    const nodes = [
      { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
      { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 1, blocks: [{ kind: 'reasoning', text: 'plan' }], finalNode: { seq: 10 } } },
      { key: 'tool-img', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: { kind: 'tool-result', content: [{ type: 'text', text: 'visible image result' }, { type: 'image', attachment: { id: 'a' } }] } } },
      { key: 'answer', kind: 'assistant-step', location: { kind: 'step', turn }, data: { step: 2, blocks: [{ kind: 'text', text: 'done' }], finalNode: { seq: 20 } } },
      { key: 'tail', kind: 'turn-tail', location: { kind: 'turn', turn }, data: { closing: { finalNode: { seq: 20 } } } },
    ]
    const result = classify(api.render({
      order: nodes.map((node) => node.key),
      nodeStore: nodeStoreFrom(nodes),
      timeline: timelineFrom([turn]),
      sessionId: 'session-promoted-image-selection',
    }), api, ChatNodeSeat)
    deepEqual(result.filter((item) => item.kind === 'disclosure').length, 1)
    deepEqual(result.filter((item) => item.kind === 'summary').length, 0)
    deepEqual(result.filter((item) => item.kind === 'seat').map((item) => item.nodeKey), ['user', 'tool-img', 'answer', 'tail'])
  })
})

test('interaction: focus inside an opened activity group survives a streaming regroup', () => {
  const contextRow = new FakeElement('context')
  const fakeDocument = {
    activeElement: null,
    documentElement: { lang: 'en' },
    head: { appendChild() {} },
    getElementById: () => ({}),
    querySelectorAll: () => [contextRow],
  }
  withGlobals({
    Element: FakeElement,
    document: fakeDocument,
    window: { getSelection: () => ({ isCollapsed: true }) },
  }, () => {
    const { api, ChatNodeSeat } = buildSandbox()
    const turn = turnLocation(12, 'open', Date.now() - 2000)
    const nodes = [
      { key: 'user', kind: 'user', location: { kind: 'session' }, data: {} },
      { key: 'think', kind: 'assistant-step', location: { kind: 'step', turn }, data: { blocks: [{ kind: 'reasoning', text: 'plan' }] } },
      { key: 'context', kind: 'context', location: { kind: 'step', turn }, data: {} },
      { key: 'tool', kind: 'tool-call', location: { kind: 'step', turn }, data: { root: {} } },
    ]
    const props = {
      order: nodes.map((node) => node.key),
      nodeStore: nodeStoreFrom(nodes),
      timeline: timelineFrom([turn]),
      sessionId: 'session-streaming-focus',
    }
    const initial = classify(api.render(props), api, ChatNodeSeat)
    const group = initial.find((item) => item.kind === 'activity-group')
    assert.ok(group)
    api.activityGroup(group.props).props.children[0].props.onToggle()

    fakeDocument.activeElement = contextRow
    const updated = classify(api.render(props), api, ChatNodeSeat)
    deepEqual(updated.filter((item) => item.kind === 'activity-group').length, 1)
    deepEqual(updated.find((item) => item.kind === 'activity-group').props.nodeKeys, ['think', 'context', 'tool'])
  })
})

test('style: module reload refreshes only the scoped plugin style', () => {
  const style = { textContent: 'stale' }
  let requestedId
  withGlobals({
    document: {
      documentElement: { lang: 'en' },
      head: { appendChild() {} },
      getElementById(id) {
        requestedId = id
        return style
      },
    },
  }, () => {
    buildSandbox()
    deepEqual(requestedId, 'ch4acko3-dsh-turn-fold-style')
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-metric-roll/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold__separator/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-activity__separator\{display:inline-block;width:1px;height:10px;margin:0 7px;/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold__clip\{display:grid;grid-template-columns:minmax\(0,1fr\);grid-template-rows:0fr;min-width:0;max-width:100%/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-activity__clip\{display:grid;grid-template-columns:minmax\(0,1fr\);grid-template-rows:0fr;min-width:0;max-width:100%/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold__body>\*\{min-width:0;max-width:100%\}/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-activity__body>\*\{min-width:0;max-width:100%\}/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings:hover\{border-color:var\(--dsw-alias-label-dimmed\)\}/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings--open\{background:var\(--dsw-alias-bg-layer-2\);border-color:var\(--dsw-alias-label-dimmed\)\}/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings__pluginName:hover\{color:var\(--dsw-alias-label-secondary\);opacity:\.72\}/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings__pluginName\[data-ready=true\],.__ch4acko3-dsh-turn-fold-settings__pluginName:focus-visible\{color:var\(--dsw-alias-state-business-primary\);opacity:1\}/)
    assert.doesNotMatch(style.textContent, /__ch4acko3-dsh-turn-fold-settings__pluginName:hover[^}]*text-decoration/)
    assert.doesNotMatch(style.textContent, /__ch4acko3-dsh-turn-fold-settings__dropDivider/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings__slot\{[^}]*min-height:44px;/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings__palette\{[^}]*min-height:44px;/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings__dropSlot:before\{[^}]*background:#3b82f6;/)
    assert.match(style.textContent, /__ch4acko3-dsh-turn-fold-settings__dragPreview\{position:fixed;z-index:1400;pointer-events:none;/)
    assert.doesNotMatch(style.textContent, /__ch4acko3-dsh-turn-fold__header:hover/)
  })
})

test('style: a foreign unscoped style is never reused or overwritten', () => {
  const foreignStyle = { textContent: 'foreign css' }
  const appended = []
  let queriedForeignStyle = false
  withGlobals({
    document: {
      documentElement: { lang: 'en' },
      getElementById: () => null,
      querySelector() {
        queriedForeignStyle = true
        return foreignStyle
      },
      createElement: () => ({
        id: '',
        textContent: '',
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value
        },
      }),
      head: { appendChild: (node) => appended.push(node) },
    },
  }, () => {
    buildSandbox()
    deepEqual(queriedForeignStyle, false)
    deepEqual(foreignStyle.textContent, 'foreign css')
    deepEqual(appended.length, 1)
    deepEqual(appended[0].id, 'ch4acko3-dsh-turn-fold-style')
    deepEqual(appended[0].attributes['data-plugin'], '@ch4acko3/dsh-turn-fold')
    assert.match(appended[0].textContent, /__ch4acko3-dsh-turn-fold/)
  })
})

process.stdout.write(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
