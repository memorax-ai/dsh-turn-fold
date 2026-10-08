// @ch4acko3/dsh-turn-fold — Harmony Source Patches for the DSH chat flow.
//
// DSH 0.1.2 split the visual chat renderer out of ui-conversation and into
// ui-chat. Keep the old compiled shape bounded through 0.1.1-rc.2, then select
// the new target and render seam for the modern chat line.

const fs = require('node:fs')
const path = require('node:path')
const { createRequire, findPackageJSON } = require('node:module')
const { pathToFileURL } = require('node:url')
const INLINE = require('./inline-source.cjs')

const LEGACY_RANGE = '>=0.1.0-rc.8 <=0.1.1-rc.2'
const DSH_MODERN_RANGE = '>=0.1.2-alpha.5 <0.1.8-0 || 0.2.0-rc.2'

function manifestVersion(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8')).version
}

function activeDshVersion() {
  const entry = process.env.DSH_HARMONY_ACTIVE_DSH_ENTRY ?? process.env.DSH_HARMONY_DSH_ENTRY
  if (entry !== undefined && typeof findPackageJSON === 'function') {
    const manifest = findPackageJSON('@deepseek-ai/dsh', pathToFileURL(path.resolve(entry)))
    if (manifest !== undefined) return manifestVersion(manifest)
  }

  const localRequire = createRequire(__filename)
  try {
    return manifestVersion(localRequire.resolve('@deepseek-ai/dsh/package.json'))
  } catch {}
  try {
    return manifestVersion(localRequire.resolve('@deepseek-ai/dsh-client-ui-conversation/package.json'))
  } catch {}
  throw new Error('@ch4acko3/dsh-turn-fold: cannot determine the active DSH version')
}

function usesUiChat(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (match === null) throw new Error(`@ch4acko3/dsh-turn-fold: invalid DSH version ${JSON.stringify(version)}`)
  const [major, minor, patch] = match.slice(1).map(Number)
  return major > 0 || minor > 1 || (minor === 1 && patch >= 2)
}

function target(packageName, version) {
  return { package: packageName, version, file: 'lib/client.js' }
}

function runtimeSource(version) {
  const [major, minor, patch] = version.split('.').map(part => Number.parseInt(part, 10))
  const modern = major > 0 || minor > 1 || (minor === 1 && patch >= 7)
  let source = INLINE.replace('var modern = typeof ctx.configForms !== "undefined";', `var modern = ${modern};`)
  if (modern) source = source
    .replaceAll('IconApiOutline14', 'IconApiOutlineRegular')
    .replaceAll('IconChevronDownOutline14', 'IconChevronDownOutlineRegular')
  return source
}

function commonPatches(targetSpec, rewrite, inline = INLINE) {
  return [
    {
      id: 'inject-turn-fold-runtime',
      description: 'Provides the Turn Fold rendering, disclosure, metrics, settings, and locale runtime used by ChatView.',
      target: targetSpec,
      select: 'FunctionDeclaration[name.name="ChatView"], VariableStatement:has(VariableDeclaration[name.name="ChatView"])',
      expect: 1,
      apply({ node, sourceFile, edit }) {
        edit.prependLeft(node.getStart(sourceFile), inline + '\n\n')
      },
    },
    {
      id: 'rewrite-node-render-loop',
      description: 'Routes ChatView node rendering through Turn Fold while preserving the native node renderer.',
      target: targetSpec,
      select: rewrite.select,
      expect: 1,
      apply: rewrite.apply,
    },
    {
      id: 'install-turn-fold-services',
      description: 'Registers Turn Fold locales and connects its settings when the chat UI starts.',
      target: targetSpec,
      select: 'VariableStatement:has(VariableDeclaration[name.name="t"][initializer.expression.name.name="bind"])',
      expect: 1,
      apply({ node, sourceFile, edit }) {
        const statement = sourceFile.text.slice(node.getStart(sourceFile), node.getEnd())
        edit.overwrite(node.getStart(sourceFile), node.getEnd(), `${statement}\n\t\t\t__ch4acko3DshTurnFoldInstall(ctx);`)
      },
    },
  ]
}

function legacyPatches() {
  return commonPatches(target('@deepseek-ai/dsh-client-ui-conversation', LEGACY_RANGE), {
    select: 'CallExpression[expression.name.name="map"][expression.expression.name="order"]',
    apply({ node, sourceFile, edit }) {
      const callback = node.arguments[0]
      if (callback === undefined) throw new Error('@ch4acko3/dsh-turn-fold: order.map callback is missing')
      const renderNode = sourceFile.text.slice(callback.getStart(sourceFile), callback.getEnd())
      edit.overwrite(
        node.getStart(sourceFile),
        node.getEnd(),
        `__ch4acko3DshTurnFoldRender({ order, nodeStore, timeline, sessionId, renderNode: ${renderNode}, t })`
      )
    },
  })
}

function dsh012Patches(version) {
  return commonPatches(target('@deepseek-ai/dsh-client-ui-chat', DSH_MODERN_RANGE), {
    select: 'CallExpression[arguments.0.name="ChatNodeList"]',
    apply({ node, sourceFile, edit }) {
      const props = node.arguments[1]
      if (props === undefined) throw new Error('@ch4acko3/dsh-turn-fold: ChatNodeList props are missing')
      const jsx = sourceFile.text.slice(node.expression.getStart(sourceFile), node.expression.getEnd())
      const nativeProps = sourceFile.text.slice(props.getStart(sourceFile), props.getEnd())
      let chatView = node.parent
      while (chatView && !(chatView.name?.getText(sourceFile) === 'ChatView' && chatView.body)) chatView = chatView.parent
      if (!chatView) throw new Error('@ch4acko3/dsh-turn-fold: ChatNodeList is outside ChatView')
      const hasTimeline = chatView.body.statements.some(statement => statement.declarationList?.declarations.some(declaration => declaration.name.getText(sourceFile) === 'timeline'))
      const timeline = hasTimeline ? 'timeline' : '__ch4acko3DshTurnFoldTimeline'
      if (!hasTimeline) edit.prependLeft(chatView.body.getStart(sourceFile) + 1, '\nconst __ch4acko3DshTurnFoldTimeline = useChat((snapshot) => snapshot.timeline);\n')
      // Newer ChatNodeSeat hides process nodes independently of Turn Fold.
      // Take over both its visibility flag and its synthetic disclosure row.
      const hasPresentation = props.properties.some((property) => property.name?.getText(sourceFile) === 'usePresentation')
      const hasNativeFolding = hasPresentation || props.properties.some((property) => property.name?.getText(sourceFile) === 'compactTranscript')
      const order = hasNativeFolding ? 'order: order.filter((key) => nodeStore.get(key)?.kind !== "turn-process")' : 'order'
      const foldingProps = hasPresentation
        ? 'usePresentation: (select) => usePresentation((policy) => select({ ...policy, foldCompletedTurns: false })), '
        : hasNativeFolding ? 'compactTranscript: false, ' : ''
      edit.overwrite(
        node.getStart(sourceFile),
        node.getEnd(),
        `__ch4acko3DshTurnFoldRender({ ${order}, nodeStore, timeline: ${timeline}, sessionId, renderNode: (nodeKey) => ${jsx}(ChatNodeSeat, { ...(${nativeProps}), ${foldingProps}nodeKey }, nodeKey), t })`
      )
    },
  }, runtimeSource(version))
}

function createPatches(version) {
  return usesUiChat(version) ? dsh012Patches(version) : legacyPatches()
}

const patches = createPatches(activeDshVersion())
Object.defineProperties(patches, {
  createPatches: { value: createPatches },
  activeDshVersion: { value: activeDshVersion },
  LEGACY_RANGE: { value: LEGACY_RANGE },
  DSH_MODERN_RANGE: { value: DSH_MODERN_RANGE },
  runtimeSource: { value: runtimeSource },
})

module.exports = patches
