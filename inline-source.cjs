'use strict'

// Runtime injected into @deepseek-ai/dsh-client-ui-conversation/lib/client.js.
// It executes inside the target module factory, where react,
// react_jsx_runtime, formatRunDuration, and formatTokens are already in scope.
const dictionaries = require('./locales.cjs')
const { DEFAULT_SUMMARY_FIELDS, SETTINGS_NAMESPACE, SUMMARY_FIELDS } = require('./settings.cjs')

module.exports = String.raw`/* @ch4acko3/dsh-turn-fold runtime (injected) */
var __ch4acko3DshTurnFoldLocaleNamespace = "@ch4acko3/dsh-turn-fold";
var __ch4acko3DshTurnFoldDictionaries = ${JSON.stringify(dictionaries)};
var __ch4acko3DshTurnFoldSettingsNamespace = ${JSON.stringify(SETTINGS_NAMESPACE)};
var __ch4acko3DshTurnFoldKnownFields = ${JSON.stringify(SUMMARY_FIELDS)};
var __ch4acko3DshTurnFoldDefaultFields = ${JSON.stringify(DEFAULT_SUMMARY_FIELDS)};
var __ch4acko3DshTurnFoldTranslate = null;
var __ch4acko3DshTurnFoldSettingsScope = null;
var __ch4acko3DshTurnFoldSummaryFields = __ch4acko3DshTurnFoldDefaultFields.slice();
var __ch4acko3DshTurnFoldSettingsListeners = new Set();
var __ch4acko3DshTurnFoldCss = [
  ".__ch4acko3-dsh-turn-fold{width:100%;min-width:0;max-width:100%;box-sizing:border-box;margin:1px 0 2px;animation:__ch4acko3-dsh-turn-fold-enter .18s cubic-bezier(.33,1,.68,1)}",
  ".__ch4acko3-dsh-turn-fold__header{display:block;width:100%;min-height:28px;box-sizing:border-box;margin:0;padding:3px 4px;color:var(--dsw-alias-label-secondary);text-align:left;font:var(--dsw-font-xs-13)}",
  "button.__ch4acko3-dsh-turn-fold__header{appearance:none;-webkit-tap-highlight-color:transparent;border:0;border-radius:0;background:transparent;cursor:pointer}",
  "button.__ch4acko3-dsh-turn-fold__header:focus-visible{outline:2px solid var(--dsw-static-deepseek-500);outline-offset:1px}",
  ".__ch4acko3-dsh-turn-fold__label{display:inline;max-width:100%;font:var(--dsw-font-xs-13);font-variant-numeric:tabular-nums;color:inherit}",
  ".__ch4acko3-dsh-turn-fold__metric{white-space:nowrap}",
  ".__ch4acko3-dsh-turn-fold__separator{display:inline-block;width:1px;height:10px;margin:0 7px;background:var(--dsw-alias-border-l2);vertical-align:-1px}",
  ".__ch4acko3-dsh-turn-fold__metricWindow{display:inline-block;overflow:hidden;vertical-align:bottom}",
  ".__ch4acko3-dsh-turn-fold__metricValue{display:inline-block;animation:__ch4acko3-dsh-turn-fold-metric-roll .2s cubic-bezier(.33,1,.68,1)}",
  ".__ch4acko3-dsh-turn-fold__rule{width:100%;height:1px;background:var(--dsw-alias-border-l3)}",
  ".__ch4acko3-dsh-turn-fold__chevron{display:inline-block;margin-left:5px;color:var(--dsw-alias-label-caption);vertical-align:-2px;transform:rotate(-90deg);transition:transform .16s cubic-bezier(.33,1,.68,1)}",
  ".__ch4acko3-dsh-turn-fold--open .__ch4acko3-dsh-turn-fold__chevron{transform:rotate(0deg)}",
  ".__ch4acko3-dsh-turn-fold__clip{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:0fr;min-width:0;max-width:100%;opacity:0;transition:grid-template-rows .18s cubic-bezier(.33,1,.68,1),opacity .14s ease}",
  ".__ch4acko3-dsh-turn-fold--open .__ch4acko3-dsh-turn-fold__clip{grid-template-rows:1fr;opacity:1}",
  ".__ch4acko3-dsh-turn-fold__bodyWrap{min-width:0;max-width:100%;min-height:0;overflow:hidden}",
  ".__ch4acko3-dsh-turn-fold__bodyWrap--overflow-visible{overflow:visible}",
  ".__ch4acko3-dsh-turn-fold__body{display:flex;min-width:0;max-width:100%;flex-direction:column;gap:16px;margin-top:12px}",
  ".__ch4acko3-dsh-turn-fold__body>*{min-width:0;max-width:100%}",
  ".__ch4acko3-dsh-turn-fold__closing{display:contents}",
  ".__ch4acko3-dsh-turn-fold__closing [data-variant=think]{display:none}",
  ".__ch4acko3-dsh-turn-fold__activityText{display:contents}",
  ".__ch4acko3-dsh-turn-fold__activityText [data-variant=think]{display:none}",
  ".__ch4acko3-dsh-turn-fold-activity{width:100%;min-width:0;max-width:100%}",
  ".__ch4acko3-dsh-turn-fold-activity__row{position:relative;overflow:hidden}",
  ".__ch4acko3-dsh-turn-fold-activity[data-state=running] .__ch4acko3-dsh-turn-fold-activity__row:after{content:\"\";position:absolute;inset-block:0;left:-300px;width:300px;pointer-events:none;background:linear-gradient(90deg,transparent 0%,color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent) 55%,transparent 100%);animation:2.6s ease-out infinite __ch4acko3-dsh-turn-fold-activity-sweep}",
  ".__ch4acko3-dsh-turn-fold-activity__leading{flex-shrink:0}",
  ".__ch4acko3-dsh-turn-fold-activity__title{font-weight:400}",
  ".__ch4acko3-dsh-turn-fold-activity__chevron{color:var(--dsw-alias-label-secondary)}",
  ".__ch4acko3-dsh-turn-fold-activity__separator{display:inline-block;width:1px;height:10px;margin:0 7px;flex:none;background:var(--dsw-alias-border-l2);vertical-align:-1px}",
  ".__ch4acko3-dsh-turn-fold-activity__failure{min-width:0;color:var(--dsw-alias-state-error-primary);font-size:14px;line-height:24px}",
  ".__ch4acko3-dsh-turn-fold-activity__clip{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:0fr;min-width:0;max-width:100%;opacity:0;transition:grid-template-rows .18s cubic-bezier(.16,1,.3,1),opacity .12s ease-out}",
  ".__ch4acko3-dsh-turn-fold-activity--open .__ch4acko3-dsh-turn-fold-activity__clip{grid-template-rows:1fr;opacity:1}",
  ".__ch4acko3-dsh-turn-fold-activity__bodyWrap{min-width:0;max-width:100%;min-height:0;overflow:hidden}",
  ".__ch4acko3-dsh-turn-fold-activity__bodyWrap--overflow-visible{overflow:visible}",
  ".__ch4acko3-dsh-turn-fold-activity__body{display:flex;min-width:0;max-width:100%;flex-direction:column;gap:8px;margin:4px 0 4px 22px}",
  ".__ch4acko3-dsh-turn-fold-activity__body>*{min-width:0;max-width:100%}",
  ".__ch4acko3-dsh-turn-fold-settings{list-style:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;transition:border-color .16s,background .16s}",
  ".__ch4acko3-dsh-turn-fold-settings:hover{border-color:var(--dsw-alias-label-dimmed)}",
  ".__ch4acko3-dsh-turn-fold-settings--open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}",
  ".__ch4acko3-dsh-turn-fold-settings__header{position:relative;display:flex;align-items:center;gap:12px;padding:14px 16px}",
  ".__ch4acko3-dsh-turn-fold-settings__headerButton{appearance:none;position:absolute;inset:0;z-index:0;width:100%;border:0;border-radius:12px;background:transparent;color:inherit;font:inherit;cursor:pointer}",
  ".__ch4acko3-dsh-turn-fold-settings__headerButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
  ".__ch4acko3-dsh-turn-fold-settings__headText{position:relative;z-index:1;display:flex;flex:1;min-width:0;flex-direction:column;gap:4px;pointer-events:none}",
  ".__ch4acko3-dsh-turn-fold-settings__titleRow{display:flex;align-items:baseline;gap:8px;min-width:0;flex-wrap:wrap}",
  ".__ch4acko3-dsh-turn-fold-settings__title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}",
  ".__ch4acko3-dsh-turn-fold-settings__pluginName{max-width:100%;overflow:hidden;color:var(--dsw-alias-label-caption);font-size:12px;font-weight:400;line-height:18px;text-decoration:none;text-overflow:ellipsis;white-space:nowrap;opacity:.38;pointer-events:auto;transition:color .16s,opacity .16s}",
  ".__ch4acko3-dsh-turn-fold-settings__pluginName:hover{color:var(--dsw-alias-label-secondary);opacity:.72}",
  ".__ch4acko3-dsh-turn-fold-settings__pluginName[data-ready=true],.__ch4acko3-dsh-turn-fold-settings__pluginName:focus-visible{color:var(--dsw-alias-state-business-primary);opacity:1}",
  ".__ch4acko3-dsh-turn-fold-settings__pluginName:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px;border-radius:2px}",
  ".__ch4acko3-dsh-turn-fold-settings__description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}",
  ".__ch4acko3-dsh-turn-fold-settings__chevron{position:relative;z-index:1;color:var(--dsw-alias-label-tertiary);flex:none;pointer-events:none;transition:transform .16s}",
  ".__ch4acko3-dsh-turn-fold-settings--open .__ch4acko3-dsh-turn-fold-settings__chevron{transform:rotate(180deg)}",
  ".__ch4acko3-dsh-turn-fold-settings__body{display:flex;flex-direction:column;gap:10px;margin:0 16px;padding:12px 0 14px;border-top:1px solid var(--dsw-alias-border-l2)}",
  ".__ch4acko3-dsh-turn-fold-settings__metricEditor{display:flex;flex-direction:column;gap:10px}",
  ".__ch4acko3-dsh-turn-fold-settings__zone{display:flex;flex-direction:column;gap:6px}",
  ".__ch4acko3-dsh-turn-fold-settings__zoneLabel{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:500;line-height:18px}",
  ".__ch4acko3-dsh-turn-fold-settings__slot{display:flex;align-items:center;align-content:center;flex-wrap:wrap;gap:7px;min-height:44px;box-sizing:border-box;padding:7px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-3);transition:border-color .16s,background .16s}",
  ".__ch4acko3-dsh-turn-fold-settings__slot[data-empty=true]{justify-content:center}",
  ".__ch4acko3-dsh-turn-fold-settings__slot[data-drop-active=true]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base)}",
  ".__ch4acko3-dsh-turn-fold-settings__palette{display:flex;align-items:center;align-content:center;flex-wrap:wrap;gap:7px;min-height:44px;box-sizing:border-box;padding:7px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-3)}",
  ".__ch4acko3-dsh-turn-fold-settings__palette[data-empty=true]{justify-content:center}",
  ".__ch4acko3-dsh-turn-fold-settings__palette[data-drop-active=true]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base)}",
  ".__ch4acko3-dsh-turn-fold-settings__tag{appearance:none;max-width:100%;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;padding:4px 10px;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;text-overflow:ellipsis;white-space:nowrap;cursor:grab;user-select:none;touch-action:none;transition:border-color .16s,color .16s,background .16s,opacity .16s}",
  ".__ch4acko3-dsh-turn-fold-settings__tag[data-selected=true]{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary)}",
  ".__ch4acko3-dsh-turn-fold-settings__tag:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed);color:var(--dsw-alias-label-primary)}",
  ".__ch4acko3-dsh-turn-fold-settings__tag:active:not(:disabled){cursor:grabbing}",
  ".__ch4acko3-dsh-turn-fold-settings__tag:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
  ".__ch4acko3-dsh-turn-fold-settings__tag:disabled{cursor:default;opacity:.45}",
  ".__ch4acko3-dsh-turn-fold-settings__dropSlot{display:flex;align-items:center;justify-content:center;width:7px;height:28px;flex:none;pointer-events:none}",
  ".__ch4acko3-dsh-turn-fold-settings__dropSlot:before{content:\"\";width:2px;height:22px;border-radius:2px;background:#3b82f6;box-shadow:0 0 4px #3b82f6,0 0 9px color-mix(in srgb,#3b82f6 65%,transparent)}",
  ".__ch4acko3-dsh-turn-fold-settings__dragPreview{position:fixed;z-index:1400;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.16))}",
  ".__ch4acko3-dsh-turn-fold-settings__dragPreview .__ch4acko3-dsh-turn-fold-settings__tag{display:block;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}",
  ".__ch4acko3-dsh-turn-fold-settings__empty{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;pointer-events:none}",
  ".__ch4acko3-dsh-turn-fold-settings__hint{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
  ".__ch4acko3-dsh-turn-fold-settings__readOnly{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px}",
  "@keyframes __ch4acko3-dsh-turn-fold-enter{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes __ch4acko3-dsh-turn-fold-metric-roll{from{opacity:.15;transform:translateY(65%)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes __ch4acko3-dsh-turn-fold-activity-sweep{0%{left:-300px}90%,to{left:100%}}",
  "@keyframes __ch4acko3-dsh-turn-fold-settings-drop-in{from{opacity:0;transform:scaleY(.45)}to{opacity:1;transform:scaleY(1)}}",
  "@media(max-width:520px){.__ch4acko3-dsh-turn-fold__label{line-height:18px}}",
  "@media(prefers-reduced-motion:no-preference){.__ch4acko3-dsh-turn-fold-settings__dropSlot{animation:__ch4acko3-dsh-turn-fold-settings-drop-in .13s cubic-bezier(.16,1,.3,1)}}",
  "@media(prefers-reduced-motion:reduce){.__ch4acko3-dsh-turn-fold,.__ch4acko3-dsh-turn-fold__metricValue,.__ch4acko3-dsh-turn-fold-activity[data-state=running] .__ch4acko3-dsh-turn-fold-activity__row:after{animation:none}.__ch4acko3-dsh-turn-fold__chevron,.__ch4acko3-dsh-turn-fold__clip,.__ch4acko3-dsh-turn-fold-activity__clip,.__ch4acko3-dsh-turn-fold-settings,.__ch4acko3-dsh-turn-fold-settings__pluginName,.__ch4acko3-dsh-turn-fold-settings__chevron,.__ch4acko3-dsh-turn-fold-settings__slot,.__ch4acko3-dsh-turn-fold-settings__tag{transition:none}}"
].join("");
if (typeof document !== "undefined") {
  var __ch4acko3DshTurnFoldStyle = document.getElementById("ch4acko3-dsh-turn-fold-style");
  if (__ch4acko3DshTurnFoldStyle === null) {
    __ch4acko3DshTurnFoldStyle = document.createElement("style");
    __ch4acko3DshTurnFoldStyle.id = "ch4acko3-dsh-turn-fold-style";
    __ch4acko3DshTurnFoldStyle.setAttribute("data-plugin", "@ch4acko3/dsh-turn-fold");
    document.head.appendChild(__ch4acko3DshTurnFoldStyle);
  }
  __ch4acko3DshTurnFoldStyle.textContent = __ch4acko3DshTurnFoldCss;
}
var __ch4acko3DshTurnFoldOpenKeys = new Set();
var __ch4acko3DshTurnFoldBodyId = 0;
function __ch4acko3DshTurnFoldText(key, params) {
  if (__ch4acko3DshTurnFoldTranslate === null) throw new Error("@ch4acko3/dsh-turn-fold: locale service was not installed");
  return __ch4acko3DshTurnFoldTranslate(key, params);
}
function __ch4acko3DshTurnFoldDecodeSettings(section) {
  if (typeof section !== "object" || section === null || !Array.isArray(section.summaryFields)) return void 0;
  var seen = new Set();
  var fields = [];
  for (var i = 0; i < section.summaryFields.length; i++) {
    var field = section.summaryFields[i];
    if (typeof field !== "string" || __ch4acko3DshTurnFoldKnownFields.indexOf(field) < 0) return void 0;
    if (!seen.has(field)) {
      seen.add(field);
      fields.push(field);
    }
  }
  return { summaryFields: fields };
}
function __ch4acko3DshTurnFoldPublishSettings(fields) {
  if (__ch4acko3DshTurnFoldSummaryFields.length === fields.length && __ch4acko3DshTurnFoldSummaryFields.every(function (field, index) { return field === fields[index]; })) return;
  __ch4acko3DshTurnFoldSummaryFields = fields.slice();
  __ch4acko3DshTurnFoldSettingsListeners.forEach(function (listener) { listener(); });
}
function __ch4acko3DshTurnFoldInstall(ctx) {
  ctx.effect(function () { return ctx.locale.register(__ch4acko3DshTurnFoldLocaleNamespace, __ch4acko3DshTurnFoldDictionaries); }, "@ch4acko3/dsh-turn-fold: dictionaries");
  __ch4acko3DshTurnFoldTranslate = ctx.locale.bind(__ch4acko3DshTurnFoldLocaleNamespace);
  var modern = typeof ctx.configForms !== "undefined";
  var scope = modern
    ? ctx.configForms.get("ch4acko3-dsh-turn-fold")
    : ctx.settingsScope.bind({ namespace: __ch4acko3DshTurnFoldSettingsNamespace, decode: __ch4acko3DshTurnFoldDecodeSettings });
  __ch4acko3DshTurnFoldSettingsScope = scope;
  function publish() {
    var snapshot = scope.getSnapshot();
    if (snapshot.status === "ready" && snapshot.value !== void 0) __ch4acko3DshTurnFoldPublishSettings(snapshot.value.summaryFields);
  }
  ctx.effect(function () { return scope.subscribe(publish); }, "@ch4acko3/dsh-turn-fold: settings");
  publish();
  var slot = modern ? "settings.plugins.tab" : "settings.plugin.item";
  ctx.slots.inject(slot, function () {
    return ctx.slots.register({
      name: slot,
      ...(modern ? { id: __ch4acko3DshTurnFoldSettingsNamespace, label: function () { return __ch4acko3DshTurnFoldText("settings.title"); } } : { key: __ch4acko3DshTurnFoldSettingsNamespace })
    }, __ch4acko3DshTurnFoldSettingsCard);
  });
}
function __ch4acko3DshTurnFoldSubscribeSettings(listener) {
  __ch4acko3DshTurnFoldSettingsListeners.add(listener);
  return function () { __ch4acko3DshTurnFoldSettingsListeners.delete(listener); };
}
function __ch4acko3DshTurnFoldGetSettingsSnapshot() {
  return __ch4acko3DshTurnFoldSummaryFields;
}
function __ch4acko3DshTurnFoldNumber(value) {
  return typeof value === "number" && isFinite(value) && value >= 0 ? value : null;
}
function __ch4acko3DshTurnFoldUsage(usage) {
  if (typeof usage !== "object" || usage === null) return null;
  var uncached = __ch4acko3DshTurnFoldNumber(usage.inputTokens);
  var output = __ch4acko3DshTurnFoldNumber(usage.outputTokens);
  if (uncached === null || output === null) return null;
  var cacheRead = usage.cacheReadTokens === void 0 ? 0 : __ch4acko3DshTurnFoldNumber(usage.cacheReadTokens);
  var cacheWrite = usage.cacheWriteTokens === void 0 ? 0 : __ch4acko3DshTurnFoldNumber(usage.cacheWriteTokens);
  var reasoning = usage.reasoningTokens === void 0 ? 0 : __ch4acko3DshTurnFoldNumber(usage.reasoningTokens);
  if (cacheRead === null || cacheWrite === null || reasoning === null) return null;
  return {
    inputTokens: uncached + cacheRead + cacheWrite,
    outputTokens: output,
    cacheReadTokens: cacheRead,
    cacheWriteTokens: cacheWrite,
    reasoningTokens: reasoning
  };
}
function __ch4acko3DshTurnFoldReasoningTexts(node) {
  var blocks = node !== void 0 && node.data !== void 0 ? node.data.blocks : void 0;
  if (!Array.isArray(blocks)) return [];
  return blocks.filter(function (block) {
    return block !== void 0 && block.kind === "reasoning" && typeof block.text === "string" && block.text.length > 0;
  }).map(function (block) { return block.text; });
}
function __ch4acko3DshTurnFoldMotionMs() {
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  return 180;
}
function __ch4acko3DshTurnFoldInteractionKeys() {
  var keys = new Set();
  if (typeof document === "undefined") return keys;
  var active = document.activeElement;
  var activeRow = active instanceof Element ? active.closest("[data-chat-anchor-key]") : null;
  if (activeRow !== null && activeRow.dataset.chatAnchorKey) keys.add(activeRow.dataset.chatAnchorKey);
  if (typeof window === "undefined" || typeof window.getSelection !== "function") return keys;
  var selection = window.getSelection();
  if (selection === null || selection.isCollapsed || selection.rangeCount === 0) return keys;
  var range = selection.getRangeAt(0);
  var rows = document.querySelectorAll("[data-chat-anchor-key]");
  for (var i = 0; i < rows.length; i++) {
    if (range.intersectsNode(rows[i]) && rows[i].dataset.chatAnchorKey) keys.add(rows[i].dataset.chatAnchorKey);
  }
  return keys;
}
function __ch4acko3DshTurnFoldChevron() {
  return react_jsx_runtime.jsx("svg", {
    className: "__ch4acko3-dsh-turn-fold__chevron",
    width: 12,
    height: 12,
    viewBox: "0 0 12 12",
    "aria-hidden": true,
    children: react_jsx_runtime.jsx("path", {
      d: "M3.5 4.5 6 7l2.5-2.5",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    })
  });
}
function __ch4acko3DshTurnFoldToolFacts(toolKeys, nodeStore) {
  var failed = 0;
  var running = false;
  for (var i = 0; i < toolKeys.length; i++) {
    var node = nodeStore.get(toolKeys[i]);
    var root = node === void 0 || node.data === void 0 ? void 0 : node.data.root;
    if (root !== void 0 && root.kind === "tool-result") {
      if (root.isError === true) failed++;
    } else {
      running = true;
    }
  }
  return { failed: failed, running: running };
}
function __ch4acko3DshTurnFoldActivityGroup(props) {
  var foldKey = props.foldKey;
  var toolCount = 0;
  var reasoningCount = 0;
  var contextCount = 0;
  for (var itemIndex = 0; itemIndex < props.items.length; itemIndex++) {
    if (props.items[itemIndex].kind === "tool") toolCount++;
    else if (props.items[itemIndex].kind === "reasoning") reasoningCount++;
    else if (props.items[itemIndex].kind === "context") contextCount++;
  }
  var initialOpen = __ch4acko3DshTurnFoldOpenKeys.has(foldKey);
  var openState = react.useState(initialOpen);
  var open = openState[0];
  var setOpen = openState[1];
  var renderedState = react.useState(initialOpen);
  var bodyRendered = renderedState[0];
  var setBodyRendered = renderedState[1];
  var overflowState = react.useState(initialOpen);
  var overflowVisible = overflowState[0];
  var setOverflowVisible = overflowState[1];
  var frameRef = react.useRef(null);
  var timerRef = react.useRef(null);
  react.useEffect(function () {
    return function () {
      if (frameRef.current !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);
  var reasoningTitle = reasoningCount === 0 ? null : __ch4acko3DshTurnFoldText("activityGroup.reasoning." + (reasoningCount === 1 ? "one" : "many"), { count: reasoningCount });
  var contextTitle = contextCount === 0 ? null : __ch4acko3DshTurnFoldText("activityGroup.context." + (contextCount === 1 ? "one" : "many"), { count: contextCount });
  var toolTitle = toolCount === 0 ? null : __ch4acko3DshTurnFoldText("activityGroup.tools." + (toolCount === 1 ? "one" : "many"), { count: toolCount });
  var titleParts = [reasoningTitle, contextTitle, toolTitle].filter(function (part) { return part !== null; });
  var titleChildren = [];
  for (var titleIndex = 0; titleIndex < titleParts.length; titleIndex++) {
    if (titleIndex > 0) titleChildren.push(react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-activity__separator", "aria-hidden": true }, "separator-" + String(titleIndex)));
    titleChildren.push(titleParts[titleIndex]);
  }
  var title = titleParts.length === 1 ? titleParts[0] : react_jsx_runtime.jsx(react_jsx_runtime.Fragment, { children: titleChildren });
  var failure = props.failed === 0 ? null : __ch4acko3DshTurnFoldText("activityGroup.failures." + (props.failed === 1 ? "one" : "many"), { count: props.failed });
  var state = props.running ? "running" : props.failed > 0 ? "error" : "ok";
  function toggle() {
    if (frameRef.current !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameRef.current);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    frameRef.current = null;
    timerRef.current = null;
    if (open) {
      __ch4acko3DshTurnFoldOpenKeys.delete(foldKey);
      setOverflowVisible(false);
      setOpen(false);
      var delay = __ch4acko3DshTurnFoldMotionMs();
      if (delay === 0) setBodyRendered(false);
      else timerRef.current = setTimeout(function () {
        timerRef.current = null;
        setBodyRendered(false);
      }, delay);
      return;
    }
    __ch4acko3DshTurnFoldOpenKeys.add(foldKey);
    setBodyRendered(true);
    var delay = __ch4acko3DshTurnFoldMotionMs();
    if (delay === 0 || typeof requestAnimationFrame !== "function") {
      setOpen(true);
      setOverflowVisible(true);
      return;
    }
    frameRef.current = requestAnimationFrame(function () {
      frameRef.current = null;
      setOpen(true);
      timerRef.current = setTimeout(function () {
        timerRef.current = null;
        setOverflowVisible(true);
      }, delay);
    });
  }
  return react_jsx_runtime.jsxs("div", {
    className: "__ch4acko3-dsh-turn-fold-activity" + (open ? " __ch4acko3-dsh-turn-fold-activity--open" : ""),
    "data-ch4acko3-dsh-turn-fold-activity": "",
    "data-ch4acko3-dsh-turn-fold-activity-open": open ? "true" : "false",
    "data-dsh-fold-owner": "@ch4acko3/dsh-turn-fold",
    "data-dsh-fold-scope": "activity-run",
    "data-dsh-fold-keys": JSON.stringify(props.nodeKeys),
    "data-state": state,
    children: [
      react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
        rowClassName: "__ch4acko3-dsh-turn-fold-activity__row",
        leadingClassName: "__ch4acko3-dsh-turn-fold-activity__leading",
        titleClassName: "__ch4acko3-dsh-turn-fold-activity__title",
        chevronClassName: "__ch4acko3-dsh-turn-fold-activity__chevron",
        icon: props.failed > 0 ? react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "error" }) : react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.IconApiOutline14, { size: 14 }),
        title: title,
        open: open,
        expandable: true,
        expandOnRowClick: true,
        onToggle: toggle,
        collapsedContent: failure === null ? void 0 : react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, { children: [
          react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-activity__separator", "aria-hidden": true }),
          react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-activity__failure", children: failure })
        ] })
      }),
      react_jsx_runtime.jsx("div", {
        className: "__ch4acko3-dsh-turn-fold-activity__clip",
        "aria-hidden": !open,
        inert: !open,
        children: bodyRendered ? react_jsx_runtime.jsx("div", {
          className: "__ch4acko3-dsh-turn-fold-activity__bodyWrap" + (overflowVisible ? " __ch4acko3-dsh-turn-fold-activity__bodyWrap--overflow-visible" : ""),
          children: react_jsx_runtime.jsx("div", {
            className: "__ch4acko3-dsh-turn-fold-activity__body",
            children: props.items.map(function (item) {
              return item.kind === "reasoning"
                ? react_jsx_runtime.jsx(ReasoningRow, { text: item.text, running: false, t: props.t }, item.key)
                : props.renderNode(item.key);
            })
          })
        }) : null
      })
    ]
  });
}
function __ch4acko3DshTurnFoldInsertionIndex(bounds, clientX, clientY) {
  if (bounds.length === 0) return 0;
  clientY = Math.max(bounds[0].top, Math.min(clientY, bounds[bounds.length - 1].bottom));
  var rows = [];
  for (var boundIndex = 0; boundIndex < bounds.length; boundIndex++) {
    var bound = bounds[boundIndex];
    var row = rows[rows.length - 1];
    if (!row || Math.abs(bound.top - row.top) > 4) {
      row = { start: boundIndex, end: boundIndex + 1, top: bound.top, bottom: bound.bottom };
      rows.push(row);
    } else {
      row.end = boundIndex + 1;
      row.bottom = Math.max(row.bottom, bound.bottom);
    }
  }
  for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    var candidate = rows[rowIndex];
    if (clientY < candidate.top) return candidate.start;
    if (clientY <= candidate.bottom) {
      for (var itemIndex = candidate.start; itemIndex < candidate.end; itemIndex++) {
        var item = bounds[itemIndex];
        if (clientX < item.left + item.width / 2) return itemIndex;
      }
      return candidate.end;
    }
  }
  return bounds.length;
}
function __ch4acko3DshTurnFoldDropDestination(dividerY, clientY) {
  return clientY <= dividerY ? "selected" : "available";
}
var __ch4acko3DshTurnFoldOwnerLinkDelay = 300;
function __ch4acko3DshTurnFoldSettingsCard() {
  var openState = react.useState(false);
  var open = openState[0];
  var setOpen = openState[1];
  var pendingState = react.useState(false);
  var pending = pendingState[0];
  var setPending = pendingState[1];
  var failedState = react.useState(false);
  var failed = failedState[0];
  var setFailed = failedState[1];
  var dragViewState = react.useState(null);
  var dragView = dragViewState[0];
  var setDragView = dragViewState[1];
  var drag = react.useRef(null);
  var selectedSlotRef = react.useRef(null);
  var paletteRef = react.useRef(null);
  var selectedTagRefs = react.useRef(new Map());
  var moveDragRef = react.useRef(null);
  var finishDragRef = react.useRef(null);
  var suppressClick = react.useRef(false);
  var ownerHoverStartedAt = react.useRef(null);
  var ownerReadyTimer = react.useRef(null);
  var ownerLinkReadyState = react.useState(false);
  var ownerLinkReady = ownerLinkReadyState[0];
  var setOwnerLinkReady = ownerLinkReadyState[1];
  react.useEffect(function () {
    if (typeof window === "undefined") return;
    function move(event) { if (moveDragRef.current) moveDragRef.current(event); }
    function finish(event) { if (finishDragRef.current) finishDragRef.current(event); }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, true);
    window.addEventListener("pointercancel", finish, true);
    return function () {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish, true);
      window.removeEventListener("pointercancel", finish, true);
    };
  }, []);
  react.useEffect(function () {
    return function () {
      if (ownerReadyTimer.current !== null) clearTimeout(ownerReadyTimer.current);
    };
  }, []);
  var scope = __ch4acko3DshTurnFoldSettingsScope;
  if (scope === null) return null;
  var snapshot = react.useSyncExternalStore(function (listener) { return scope.subscribe(listener); }, function () { return scope.getSnapshot(); }, function () { return scope.getSnapshot(); });
  if (snapshot.status !== "ready" || snapshot.value === void 0) return null;
  var fields = snapshot.value.summaryFields;
  var availableFields = __ch4acko3DshTurnFoldKnownFields.filter(function (field) { return fields.indexOf(field) < 0; });
  var title = __ch4acko3DshTurnFoldText("settings.title");
  function toggleOpen() {
    setOpen(function (current) { return !current; });
  }
  function beginOwnerHover() {
    if (ownerReadyTimer.current !== null) clearTimeout(ownerReadyTimer.current);
    ownerHoverStartedAt.current = Date.now();
    setOwnerLinkReady(false);
    ownerReadyTimer.current = setTimeout(function () {
      ownerReadyTimer.current = null;
      setOwnerLinkReady(true);
    }, __ch4acko3DshTurnFoldOwnerLinkDelay);
  }
  function endOwnerHover() {
    if (ownerReadyTimer.current !== null) clearTimeout(ownerReadyTimer.current);
    ownerReadyTimer.current = null;
    ownerHoverStartedAt.current = null;
    setOwnerLinkReady(false);
  }
  function activateOwnerLink(event) {
    if (event.detail === 0) return;
    var startedAt = ownerHoverStartedAt.current;
    if (ownerLinkReady || typeof startedAt === "number" && Date.now() - startedAt >= __ch4acko3DshTurnFoldOwnerLinkDelay) return;
    event.preventDefault();
    toggleOpen();
  }
  function saveFields(next) {
    if (!snapshot.writable || pending) return;
    if (next.length === fields.length && next.every(function (field, index) { return field === fields[index]; })) return;
    setPending(true);
    setFailed(false);
    scope.set("summaryFields", next).then(function (accepted) {
      setPending(false);
      if (accepted === false) setFailed(true);
    }, function () {
      setPending(false);
      setFailed(true);
    });
  }
  function addField(field) {
    if (__ch4acko3DshTurnFoldKnownFields.indexOf(field) < 0 || fields.indexOf(field) >= 0) return;
    saveFields(fields.concat(field));
  }
  function removeField(field) {
    saveFields(fields.filter(function (candidate) { return candidate !== field; }));
  }
  function placeFieldAt(field, index) {
    if (__ch4acko3DshTurnFoldKnownFields.indexOf(field) < 0) return;
    var next = fields.filter(function (candidate) { return candidate !== field; });
    next.splice(Math.max(0, Math.min(index, next.length)), 0, field);
    saveFields(next);
  }
  function projectDrag(clientX, clientY, field) {
    var selectedSlot = selectedSlotRef.current;
    var palette = paletteRef.current;
    if (!selectedSlot || !palette) return { destination: null, index: 0 };
    var selectedBounds = selectedSlot.getBoundingClientRect();
    var paletteBounds = palette.getBoundingClientRect();
    var destination = __ch4acko3DshTurnFoldDropDestination((selectedBounds.bottom + paletteBounds.top) / 2, clientY);
    if (destination === "selected") {
      var remaining = fields.filter(function (candidate) { return candidate !== field; });
      var bounds = remaining.map(function (candidate) {
        var element = selectedTagRefs.current.get(candidate);
        return element ? element.getBoundingClientRect() : null;
      }).filter(function (value) { return value !== null; });
      return { destination: "selected", index: __ch4acko3DshTurnFoldInsertionIndex(bounds, clientX, clientY) };
    }
    if (destination === "available") return { destination: "available", index: 0 };
    return { destination: null, index: 0 };
  }
  function beginPointerDrag(event, field) {
    if (event.button !== 0 || !snapshot.writable || pending) return;
    var bounds = event.currentTarget.getBoundingClientRect();
    drag.current = {
      field: field,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      selected: fields.indexOf(field) >= 0,
      width: bounds.width,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top
    };
  }
  function movePointerDrag(event) {
    var active = drag.current;
    if (!active || active.pointerId !== event.pointerId || pending) return;
    active.lastX = event.clientX;
    active.lastY = event.clientY;
    if (!active.moved && Math.hypot(event.clientX - active.originX, event.clientY - active.originY) < 8) return;
    active.moved = true;
    event.preventDefault();
    var projection = projectDrag(event.clientX, event.clientY, active.field);
    setDragView({
      field: active.field,
      selected: active.selected,
      x: event.clientX,
      y: event.clientY,
      width: active.width,
      offsetX: active.offsetX,
      offsetY: active.offsetY,
      destination: projection.destination,
      index: projection.index
    });
  }
  function finishPointerDrag(event) {
    var active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!active.moved) return;
    event.preventDefault();
    var projection = projectDrag(event.clientX, event.clientY, active.field);
    setDragView(null);
    if (projection.destination === "selected") placeFieldAt(active.field, projection.index);
    else if (projection.destination === "available" && active.selected) removeField(active.field);
    suppressClick.current = true;
    if (typeof window === "undefined") suppressClick.current = false;
    else window.setTimeout(function () { suppressClick.current = false; }, 0);
  }
  moveDragRef.current = movePointerDrag;
  finishDragRef.current = finishPointerDrag;
  function renderTag(field, selected) {
    var label = __ch4acko3DshTurnFoldText("settings." + field);
    return react_jsx_runtime.jsx("button", {
      ref: selected ? function (element) {
        if (element === null) selectedTagRefs.current.delete(field);
        else selectedTagRefs.current.set(field, element);
      } : void 0,
      type: "button",
      className: "__ch4acko3-dsh-turn-fold-settings__tag",
      "data-field": field,
      "data-selected": selected ? "true" : "false",
      disabled: !snapshot.writable || pending,
      "aria-label": __ch4acko3DshTurnFoldText(selected ? "settings.removeMetric" : "settings.addMetric", { label: label }),
      onClick: function () {
        if (suppressClick.current) return;
        if (selected) removeField(field);
        else addField(field);
      },
      onPointerDown: function (event) { beginPointerDrag(event, field); },
      onKeyDown: selected ? function (event) {
        if (!event.altKey || event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        var index = fields.indexOf(field);
        var target = event.key === "ArrowLeft" ? Math.max(0, index - 1) : Math.min(fields.length - 1, index + 1);
        if (target !== index) placeFieldAt(field, event.key === "ArrowLeft" ? target : target + 1);
      } : void 0,
      children: label
    }, field);
  }
  var movingField = dragView === null ? null : dragView.field;
  var visibleSelected = fields.filter(function (field) { return field !== movingField; });
  var selectedChildren = [];
  for (var selectedIndex = 0; selectedIndex <= visibleSelected.length; selectedIndex++) {
    if (dragView !== null && dragView.destination === "selected" && dragView.index === selectedIndex) {
      selectedChildren.push(react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-settings__dropSlot", "aria-hidden": true }, "drop-" + selectedIndex));
    }
    if (selectedIndex < visibleSelected.length) selectedChildren.push(renderTag(visibleSelected[selectedIndex], true));
  }
  if (selectedChildren.length === 0) selectedChildren.push(react_jsx_runtime.jsx("p", { className: "__ch4acko3-dsh-turn-fold-settings__empty", children: __ch4acko3DshTurnFoldText("settings.emptySelection") }, "empty"));
  var visibleAvailable = availableFields.filter(function (field) { return field !== movingField; });
  return react_jsx_runtime.jsxs("li", {
    className: "__ch4acko3-dsh-turn-fold-settings" + (open ? " __ch4acko3-dsh-turn-fold-settings--open" : ""),
    "data-ch4acko3-dsh-turn-fold-settings": "",
    children: [
      react_jsx_runtime.jsxs("div", {
        className: "__ch4acko3-dsh-turn-fold-settings__header",
        children: [
          react_jsx_runtime.jsx("button", {
            type: "button",
            className: "__ch4acko3-dsh-turn-fold-settings__headerButton",
            "aria-expanded": open,
            "aria-label": __ch4acko3DshTurnFoldText(open ? "settings.collapse" : "settings.expand", { title: title }),
            onClick: toggleOpen
          }),
          react_jsx_runtime.jsxs("span", {
            className: "__ch4acko3-dsh-turn-fold-settings__headText",
            children: [
              react_jsx_runtime.jsxs("span", {
                className: "__ch4acko3-dsh-turn-fold-settings__titleRow",
                children: [
                  react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-settings__title", children: title }),
                  react_jsx_runtime.jsx("a", {
                    className: "__ch4acko3-dsh-turn-fold-settings__pluginName",
                    href: "https://github.com/memorax-ai/dsh-turn-fold",
                    target: "_blank",
                    rel: "noreferrer",
                    "data-ready": ownerLinkReady ? "true" : "false",
                    onPointerEnter: beginOwnerHover,
                    onPointerLeave: endOwnerHover,
                    onClick: activateOwnerLink,
                    children: "@ch4acko3/dsh-turn-fold"
                  })
                ]
              }),
              react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-settings__description", children: __ch4acko3DshTurnFoldText("settings.description") })
            ]
          }),
          react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: "__ch4acko3-dsh-turn-fold-settings__chevron" })
        ]
      }),
      open ? react_jsx_runtime.jsxs("div", {
        className: "__ch4acko3-dsh-turn-fold-settings__body",
        children: [
          !snapshot.writable ? react_jsx_runtime.jsx("p", { className: "__ch4acko3-dsh-turn-fold-settings__readOnly", role: "status", children: __ch4acko3DshTurnFoldText("settings.readOnly") }) : null,
          failed ? react_jsx_runtime.jsx("p", { className: "__ch4acko3-dsh-turn-fold-settings__readOnly", role: "alert", children: __ch4acko3DshTurnFoldText("settings.writeFailed") }) : null,
          react_jsx_runtime.jsxs("div", {
            className: "__ch4acko3-dsh-turn-fold-settings__metricEditor",
            children: [
              react_jsx_runtime.jsxs("div", {
                className: "__ch4acko3-dsh-turn-fold-settings__zone",
                children: [
                  react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-settings__zoneLabel", children: __ch4acko3DshTurnFoldText("settings.selectedMetrics") }),
                  react_jsx_runtime.jsx("div", {
                    ref: selectedSlotRef,
                    className: "__ch4acko3-dsh-turn-fold-settings__slot",
                    role: "group",
                    "aria-label": __ch4acko3DshTurnFoldText("settings.selectedMetrics"),
                    "data-empty": visibleSelected.length === 0 && !(dragView !== null && dragView.destination === "selected") ? "true" : "false",
                    "data-drop-active": dragView !== null && dragView.destination === "selected" ? "true" : "false",
                    children: selectedChildren
                  })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "__ch4acko3-dsh-turn-fold-settings__zone",
                children: [
                  react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold-settings__zoneLabel", children: __ch4acko3DshTurnFoldText("settings.availableMetrics") }),
                  react_jsx_runtime.jsx("div", {
                    ref: paletteRef,
                    className: "__ch4acko3-dsh-turn-fold-settings__palette",
                    role: "group",
                    "aria-label": __ch4acko3DshTurnFoldText("settings.availableMetrics"),
                    "data-empty": visibleAvailable.length === 0 ? "true" : "false",
                    "data-drop-active": dragView !== null && dragView.destination === "available" ? "true" : "false",
                    children: visibleAvailable.length === 0
                      ? react_jsx_runtime.jsx("p", { className: "__ch4acko3-dsh-turn-fold-settings__empty", children: __ch4acko3DshTurnFoldText("settings.allSelected") })
                      : visibleAvailable.map(function (field) { return renderTag(field, false); })
                  })
                ]
              })
            ]
          }),
          react_jsx_runtime.jsx("p", { className: "__ch4acko3-dsh-turn-fold-settings__hint", children: __ch4acko3DshTurnFoldText("settings.dragHint") }),
          dragView === null ? null : react_jsx_runtime.jsx("div", {
            className: "__ch4acko3-dsh-turn-fold-settings__dragPreview",
            style: {
              left: dragView.x - dragView.offsetX + "px",
              top: dragView.y - dragView.offsetY + "px",
              width: dragView.width + "px"
            },
            children: react_jsx_runtime.jsx("span", {
              className: "__ch4acko3-dsh-turn-fold-settings__tag",
              "data-selected": dragView.selected ? "true" : "false",
              children: __ch4acko3DshTurnFoldText("settings." + dragView.field)
            })
          })
        ]
      }) : null
    ]
  });
}
function __ch4acko3DshTurnFoldLiveDuration(metrics, running) {
  var nowState = react.useState(function () { return Date.now(); });
  var now = nowState[0];
  var setNow = nowState[1];
  react.useEffect(function () {
    if (!running || typeof metrics.startTime !== "number") return;
    var timer = setInterval(function () { setNow(Date.now()); }, 1000);
    return function () { clearInterval(timer); };
  }, [running, metrics.startTime]);
  if (running && typeof metrics.startTime === "number") return Math.max(0, now - metrics.startTime);
  return metrics.durationMs;
}
function __ch4acko3DshTurnFoldSpacedDuration(value) {
  // rc.2 exposes numeric/unit segments; earlier hosts return one string.
  if (Array.isArray(value)) value = value.map(function (part) {
    if (part === null || typeof part !== "object" || typeof part.text !== "string") throw new Error("@ch4acko3/dsh-turn-fold: unsupported native duration segment");
    return part.text;
  }).join("");
  if (typeof value !== "string") throw new Error("@ch4acko3/dsh-turn-fold: unsupported native duration format");
  return value.replace(/(\d)(?=(?:小时|分钟|秒|分|时))/g, "$1 ").replace(/(小时|分钟|秒|分|时)(?=\d)/g, "$1 ");
}
function __ch4acko3DshTurnFoldAnimatedPart(field, key, parameter, display, animationKey, qualifier) {
  var marker = "__ch4acko3_dsh_turn_fold_value__";
  var params = {};
  params[parameter] = marker;
  var template = __ch4acko3DshTurnFoldText(key, params);
  var position = template.indexOf(marker);
  if (position < 0) throw new Error("@ch4acko3/dsh-turn-fold: summary locale omitted {" + parameter + "} for " + key);
  qualifier = qualifier || "";
  return {
    field: field,
    text: template.slice(0, position) + qualifier + display + template.slice(position + marker.length),
    prefix: template.slice(0, position) + qualifier,
    value: display,
    suffix: template.slice(position + marker.length),
    rolling: true,
    animationKey: String(animationKey)
  };
}
function __ch4acko3DshTurnFoldCountPart(field, key, count, display, qualifier) {
  return __ch4acko3DshTurnFoldAnimatedPart(field, key, "count", display, count, qualifier);
}
function __ch4acko3DshTurnFoldDurationPart(field, key, duration) {
  var part = __ch4acko3DshTurnFoldAnimatedPart(field, key, "duration", duration, duration);
  part.segments = duration.split(/(\d+)/).filter(function (segment) { return segment.length > 0; });
  return part;
}
function __ch4acko3DshTurnFoldSummaryParts(metrics, running, settled, completed, durationT) {
  var fields = react.useSyncExternalStore(__ch4acko3DshTurnFoldSubscribeSettings, __ch4acko3DshTurnFoldGetSettingsSnapshot, __ch4acko3DshTurnFoldGetSettingsSnapshot);
  var durationMs = __ch4acko3DshTurnFoldLiveDuration(metrics, running);
  var parts = [];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var value = metrics[field];
    if (field === "duration") {
      if (typeof durationMs === "number" && isFinite(durationMs) && durationMs >= 0) {
        var duration = __ch4acko3DshTurnFoldSpacedDuration(formatRunDuration(durationMs, durationT));
        parts.push(__ch4acko3DshTurnFoldDurationPart(field, completed ? "summary.elapsed" : "summary.duration", duration));
      }
    } else if (field === "toolCalls" || field === "modelCalls") {
      if (typeof value === "number") parts.push(__ch4acko3DshTurnFoldCountPart(field, "summary." + field + (value === 1 ? ".one" : ".many"), value, String(value)));
    } else if (field === "timeToFirstToken") {
      if (typeof value === "number") parts.push({ field: field, text: __ch4acko3DshTurnFoldText("summary.timeToFirstToken", { seconds: value < 10000 ? Math.round(value / 100) / 10 : Math.round(value / 1000) }) });
    } else if (field === "tokensPerSecond") {
      if (typeof value === "number") parts.push({ field: field, text: __ch4acko3DshTurnFoldText("summary.tokensPerSecond", { count: value >= 10 ? Math.round(value) : Math.round(value * 10) / 10 }) });
    } else if (typeof value === "number") {
      parts.push(__ch4acko3DshTurnFoldCountPart(field, "summary." + field, value, formatTokens(value, durationT), metrics.tokenUsagePartial && settled ? "≥ " : ""));
    }
  }
  return parts.length === 0 ? [{ field: "activity", text: __ch4acko3DshTurnFoldText("summary.activity") }] : parts;
}
function __ch4acko3DshTurnFoldSummaryLabel(parts) {
  return parts.map(function (part) { return part.text; }).join(" | ");
}
function __ch4acko3DshTurnFoldStatusSuffix(termination) {
  if (termination === "aborted") return __ch4acko3DshTurnFoldText("summary.stoppedSuffix");
  if (termination === "interrupted") return __ch4acko3DshTurnFoldText("summary.interruptedSuffix");
  return "";
}
function __ch4acko3DshTurnFoldSummaryChildren(parts, disclosure, statusSuffix) {
  var children = [];
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (i > 0) children.push(react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold__separator", "aria-hidden": true }, "separator-" + i));
    var animatedValue = part.segments === void 0
      ? react_jsx_runtime.jsx("span", {
        className: "__ch4acko3-dsh-turn-fold__metricWindow",
        children: react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold__metricValue", children: part.value }, part.field + "-" + part.animationKey)
      }, "value")
      : part.segments.map(function (segment, segmentIndex) {
        return /^\d+$/.test(segment) ? react_jsx_runtime.jsx("span", {
          className: "__ch4acko3-dsh-turn-fold__metricWindow",
          children: react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold__metricValue", children: segment }, part.field + "-" + segmentIndex + "-" + segment)
        }, "segment-" + segmentIndex) : segment;
      });
    var content = part.rolling ? [part.prefix, animatedValue, part.suffix] : part.text;
    children.push((part.rolling ? react_jsx_runtime.jsxs : react_jsx_runtime.jsx)("span", { className: "__ch4acko3-dsh-turn-fold__metric", children: content }, part.field));
  }
  if (statusSuffix) children.push(react_jsx_runtime.jsx("span", { className: "__ch4acko3-dsh-turn-fold__metric", children: statusSuffix }, "status"));
  if (disclosure) children.push(react_jsx_runtime.jsx(__ch4acko3DshTurnFoldChevron, {}, "chevron"));
  return children;
}
function __ch4acko3DshTurnFoldSummary(props) {
  var parts = __ch4acko3DshTurnFoldSummaryParts(props.metrics, props.running, props.settled, props.completed, props.t);
  var statusSuffix = __ch4acko3DshTurnFoldStatusSuffix(props.termination);
  var label = __ch4acko3DshTurnFoldSummaryLabel(parts) + statusSuffix;
  return react_jsx_runtime.jsxs("div", {
    className: "__ch4acko3-dsh-turn-fold",
    "data-ch4acko3-dsh-turn-fold-summary": props.running ? "running" : "complete",
    "data-dsh-summary-owner": "@ch4acko3/dsh-turn-fold",
    children: [
      react_jsx_runtime.jsx("div", {
        className: "__ch4acko3-dsh-turn-fold__header",
        role: props.running ? "status" : void 0,
        "aria-label": props.running ? label : void 0,
        children: react_jsx_runtime.jsxs("span", { className: "__ch4acko3-dsh-turn-fold__label", "aria-hidden": props.running ? true : void 0, children: __ch4acko3DshTurnFoldSummaryChildren(parts, false, statusSuffix) })
      }),
      react_jsx_runtime.jsx("div", { className: "__ch4acko3-dsh-turn-fold__rule", "aria-hidden": true })
    ]
  });
}
function __ch4acko3DshTurnFoldNodeTurn(node) {
  var location = node === void 0 ? void 0 : node.location;
  return location !== void 0 && (location.kind === "turn" || location.kind === "step") ? location.turn.turn : null;
}
function __ch4acko3DshTurnFoldHasVisibleNonReasoning(node) {
  var blocks = node.data === void 0 ? void 0 : node.data.blocks;
  if (!Array.isArray(blocks)) return false;
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    if (block === void 0 || block.kind === "reasoning" || block.kind === "tool-call") continue;
    if (block.kind !== "text" || typeof block.text !== "string" || block.text.trim() !== "") return true;
  }
  return false;
}
function __ch4acko3DshTurnFoldHasToolCallBlock(node) {
  var blocks = node.data === void 0 ? void 0 : node.data.blocks;
  return Array.isArray(blocks) && blocks.some(function (block) { return block !== void 0 && block.kind === "tool-call"; });
}
// An image tool result is a primary visual artifact, not an intermediate step, so
// it should stay visible when the surrounding agent activity folds. Detection is
// content-based (any tool-result carrying an image block) rather than tied to a
// particular tool name, so it keeps working for any plugin that emits images.
function __ch4acko3DshTurnFoldIsPromotableImageResult(node) {
  if (node === void 0 || node.kind !== "tool-call" || node.data === void 0) return false;
  var root = node.data.root;
  if (root === void 0 || root.kind !== "tool-result" || !Array.isArray(root.content)) return false;
  for (var index = 0; index < root.content.length; index++) {
    if (root.content[index] !== void 0 && root.content[index].type === "image") return true;
  }
  return false;
}
function __ch4acko3DshTurnFoldIsActivityNode(node) {
  if (node.kind === "tool-call" || node.kind === "context") return true;
  if (node.kind !== "assistant-step" || __ch4acko3DshTurnFoldReasoningTexts(node).length === 0) return false;
  return __ch4acko3DshTurnFoldHasToolCallBlock(node) || !__ch4acko3DshTurnFoldHasVisibleNonReasoning(node);
}
function __ch4acko3DshTurnFoldRenderNativeEntry(entry, renderNode, hideReasoning) {
  var rendered = renderNode(entry.key);
  if (hideReasoning) rendered = react_jsx_runtime.jsx("div", {
    className: "__ch4acko3-dsh-turn-fold__activityText",
    children: rendered
  }, "activity-text:" + String(entry.key));
  return entry.closingKey === void 0 ? rendered : react_jsx_runtime.jsx("div", {
    className: "__ch4acko3-dsh-turn-fold__closing",
    children: rendered
  }, entry.closingKey);
}
function __ch4acko3DshTurnFoldRenderEntries(entries, nodeStore, renderNode, sessionId, interactionKeys, t) {
  var out = [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (entry.type === "element") {
      out.push(entry.element);
      continue;
    }
    var turn = __ch4acko3DshTurnFoldNodeTurn(entry.node);
    if (!__ch4acko3DshTurnFoldIsActivityNode(entry.node)) {
      out.push(__ch4acko3DshTurnFoldRenderNativeEntry(entry, renderNode, false));
      continue;
    }
    var activityEntries = [entry];
    var j = i + 1;
    while (j < entries.length) {
      var next = entries[j];
      if (next.type !== "node" || !__ch4acko3DshTurnFoldIsActivityNode(next.node) || next.order !== activityEntries[activityEntries.length - 1].order + 1 || __ch4acko3DshTurnFoldNodeTurn(next.node) !== turn) break;
      if (__ch4acko3DshTurnFoldHasVisibleNonReasoning(next.node)) break;
      activityEntries.push(next);
      j++;
    }
    var foldKeyPrefix = "activity:" + String(sessionId) + ":" + String(turn) + ":";
    var foldKey = foldKeyPrefix + String(entry.key);
    // Preserve an open group's identity when earlier activity joins it during streaming.
    if (!__ch4acko3DshTurnFoldOpenKeys.has(foldKey)) {
      for (var foldKeyIndex = 1; foldKeyIndex < activityEntries.length; foldKeyIndex++) {
        var openFoldKey = foldKeyPrefix + String(activityEntries[foldKeyIndex].key);
        if (__ch4acko3DshTurnFoldOpenKeys.has(openFoldKey)) {
          foldKey = openFoldKey;
          break;
        }
      }
    }
    // Focus inside an already-open group belongs to its native disclosure rows.
    // Keep their parent stable when a streaming Session snapshot renders again.
    var selected = !__ch4acko3DshTurnFoldOpenKeys.has(foldKey) && activityEntries.some(function (activityEntry) { return interactionKeys.has(activityEntry.key); });
    if (turn === null || activityEntries.length < 2 || selected) {
      for (var k = 0; k < activityEntries.length; k++) out.push(__ch4acko3DshTurnFoldRenderNativeEntry(activityEntries[k], renderNode, false));
    } else {
      var items = [];
      var toolKeys = [];
      for (var activityIndex = 0; activityIndex < activityEntries.length; activityIndex++) {
        var activityEntry = activityEntries[activityIndex];
        if (activityEntry.node.kind === "tool-call") {
          toolKeys.push(activityEntry.key);
          items.push({ kind: "tool", key: activityEntry.key });
        } else if (activityEntry.node.kind === "context") {
          items.push({ kind: "context", key: activityEntry.key });
        } else {
          var texts = __ch4acko3DshTurnFoldReasoningTexts(activityEntry.node);
          for (var textIndex = 0; textIndex < texts.length; textIndex++) items.push({ kind: "reasoning", key: String(activityEntry.key) + ":" + String(textIndex), text: texts[textIndex] });
        }
      }
      if (__ch4acko3DshTurnFoldHasVisibleNonReasoning(entry.node)) out.push(__ch4acko3DshTurnFoldRenderNativeEntry(entry, renderNode, true));
      var facts = __ch4acko3DshTurnFoldToolFacts(toolKeys, nodeStore);
      out.push(react_jsx_runtime.jsx(__ch4acko3DshTurnFoldActivityGroup, {
        failed: facts.failed,
        foldKey: foldKey,
        items: items,
        nodeKeys: activityEntries.map(function (activityEntry) { return activityEntry.key; }),
        renderNode: renderNode,
        running: facts.running,
        t: t
      }, foldKey));
    }
    i = j - 1;
  }
  return out;
}
function __ch4acko3DshTurnFoldRenderKeys(keys, orderPositions, nodeStore, renderNode, sessionId, t) {
  var entries = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var node = nodeStore.get(key);
    if (node !== void 0) entries.push({ type: "node", key: key, node: node, order: orderPositions.get(key) });
  }
  return __ch4acko3DshTurnFoldRenderEntries(entries, nodeStore, renderNode, sessionId, new Set(), t);
}
function __ch4acko3DshTurnFoldDisclosure(props) {
  var activity = props.activity;
  var foldKey = props.foldKey;
  var renderNode = props.renderNode;
  var initialOpen = __ch4acko3DshTurnFoldOpenKeys.has(foldKey);
  var expandedState = react.useState(initialOpen);
  var expanded = expandedState[0];
  var setExpanded = expandedState[1];
  var renderedState = react.useState(initialOpen);
  var bodyRendered = renderedState[0];
  var setBodyRendered = renderedState[1];
  var overflowState = react.useState(initialOpen);
  var overflowVisible = overflowState[0];
  var setOverflowVisible = overflowState[1];
  var frameRef = react.useRef(null);
  var timerRef = react.useRef(null);
  var bodyIdState = react.useState(function () { return "ch4acko3-dsh-turn-fold-body-" + (++__ch4acko3DshTurnFoldBodyId); });
  var bodyId = bodyIdState[0];
  react.useEffect(function () {
    return function () {
      if (frameRef.current !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);
  var parts = __ch4acko3DshTurnFoldSummaryParts(props.metrics, false, true, props.completed, props.t);
  var statusSuffix = __ch4acko3DshTurnFoldStatusSuffix(props.termination);
  var label = __ch4acko3DshTurnFoldSummaryLabel(parts) + statusSuffix;
  var actionLabel = __ch4acko3DshTurnFoldText(expanded ? "action.collapse" : "action.expand", { summary: label });
  function toggle() {
    if (frameRef.current !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frameRef.current);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    frameRef.current = null;
    timerRef.current = null;
    if (expanded) {
      __ch4acko3DshTurnFoldOpenKeys.delete(foldKey);
      setOverflowVisible(false);
      setExpanded(false);
      var delay = __ch4acko3DshTurnFoldMotionMs();
      if (delay === 0) setBodyRendered(false);
      else timerRef.current = setTimeout(function () {
        timerRef.current = null;
        setBodyRendered(false);
      }, delay);
      return;
    }
    __ch4acko3DshTurnFoldOpenKeys.add(foldKey);
    setBodyRendered(true);
    var delay = __ch4acko3DshTurnFoldMotionMs();
    if (delay === 0 || typeof requestAnimationFrame !== "function") {
      setExpanded(true);
      setOverflowVisible(true);
      return;
    }
    frameRef.current = requestAnimationFrame(function () {
      frameRef.current = null;
      setExpanded(true);
      timerRef.current = setTimeout(function () {
        timerRef.current = null;
        setOverflowVisible(true);
      }, delay);
    });
  }
  return react_jsx_runtime.jsxs("div", {
    className: "__ch4acko3-dsh-turn-fold" + (expanded ? " __ch4acko3-dsh-turn-fold--open" : ""),
    "data-ch4acko3-dsh-turn-fold": "",
    "data-ch4acko3-dsh-turn-fold-open": expanded ? "true" : "false",
    "data-dsh-fold-owner": "@ch4acko3/dsh-turn-fold",
    "data-dsh-fold-scope": "turn",
    "data-dsh-fold-keys": JSON.stringify(activity),
    children: [
      react_jsx_runtime.jsx("button", {
        type: "button",
        className: "__ch4acko3-dsh-turn-fold__header",
        "aria-expanded": expanded,
        "aria-controls": bodyId,
        "aria-label": actionLabel,
        title: actionLabel,
        onClick: toggle,
        children: react_jsx_runtime.jsxs("span", { className: "__ch4acko3-dsh-turn-fold__label", "aria-hidden": true, children: __ch4acko3DshTurnFoldSummaryChildren(parts, true, statusSuffix) })
      }),
      react_jsx_runtime.jsx("div", { className: "__ch4acko3-dsh-turn-fold__rule", "aria-hidden": true }),
      react_jsx_runtime.jsx("div", {
        id: bodyId,
        className: "__ch4acko3-dsh-turn-fold__clip",
        "aria-hidden": !expanded,
        inert: !expanded,
        children: bodyRendered ? react_jsx_runtime.jsx("div", {
          className: "__ch4acko3-dsh-turn-fold__bodyWrap" + (overflowVisible ? " __ch4acko3-dsh-turn-fold__bodyWrap--overflow-visible" : ""),
          children: react_jsx_runtime.jsxs("div", {
            className: "__ch4acko3-dsh-turn-fold__body",
            children: [
              __ch4acko3DshTurnFoldRenderKeys(activity, props.orderPositions, props.nodeStore, renderNode, props.sessionId, props.t),
              (props.closingReasoning || []).map(function (text, index) {
                return react_jsx_runtime.jsx(ReasoningRow, { text: text, running: false, t: props.t }, "closing-reasoning-" + index);
              })
            ]
          })
        }) : null
      })
    ]
  });
}
function __ch4acko3DshTurnFoldPlaybackTime(timeline) {
  var clock = timeline.playbackClock;
  return clock !== void 0 && clock.kind === "historical" && typeof clock.time === "number" && isFinite(clock.time)
    ? clock.time
    : null;
}
function __ch4acko3DshTurnFoldPlanMetrics(plan, nodeStore, timeline) {
  var turnLoc = timeline.turns.get(plan.turn);
  var startEv = turnLoc === void 0 ? void 0 : turnLoc.start;
  var endEv = turnLoc === void 0 ? void 0 : turnLoc.end;
  var startTime = startEv !== void 0 && typeof startEv.time === "number" ? startEv.time : null;
  var complete = startTime !== null && endEv !== void 0 && typeof endEv.time === "number";
  var playbackTime = __ch4acko3DshTurnFoldPlaybackTime(timeline);
  var durationMs = complete && endEv.time >= startTime
    ? endEv.time - startTime
    : startTime !== null && playbackTime !== null
      ? Math.max(0, playbackTime - startTime)
      : null;
  var metrics = {
    startTime: startTime,
    durationMs: durationMs,
    toolCalls: 0,
    modelCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    tokenUsagePartial: false,
    timeToFirstToken: null,
    tokensPerSecond: null
  };
  var usageReliable = true;
  var usageSamples = 0;
  var decodeMs = 0;
  var decodeTokens = 0;
  var sampledDecode = false;
  var firstStep = null;
  var keys = plan.activity.slice();
  if (plan.closingKey !== void 0 && keys.indexOf(plan.closingKey) < 0) keys.push(plan.closingKey);
  for (var i = 0; i < keys.length; i++) {
    var node = nodeStore.get(keys[i]);
    if (node === void 0) continue;
    if (node.kind === "tool-call") metrics.toolCalls++;
    if (node.kind !== "assistant-step") continue;
    metrics.modelCalls++;
    var data = node.data === void 0 ? {} : node.data;
    var usage = __ch4acko3DshTurnFoldUsage(data.usage);
    if (usage === null) usageReliable = false;
    else {
      usageSamples++;
      metrics.inputTokens += usage.inputTokens;
      metrics.outputTokens += usage.outputTokens;
      metrics.cacheReadTokens += usage.cacheReadTokens;
      metrics.cacheWriteTokens += usage.cacheWriteTokens;
      metrics.reasoningTokens += usage.reasoningTokens;
    }
    var finalNode = data.finalNode;
    var timing = finalNode === void 0 ? void 0 : finalNode.timing;
    var step = typeof data.step === "number" ? data.step : i;
    if (timing !== void 0 && timing.stepStartTime !== null && timing.firstTokenTime !== null && (firstStep === null || step < firstStep)) {
      firstStep = step;
      metrics.timeToFirstToken = Math.max(0, timing.firstTokenTime - timing.stepStartTime);
    }
    if (timing !== void 0 && timing.firstTokenTime !== null && typeof timing.completedTime === "number" && usage !== null) {
      decodeMs += Math.max(0, timing.completedTime - timing.firstTokenTime);
      decodeTokens += usage.outputTokens;
      sampledDecode = true;
    }
  }
  if (sampledDecode && decodeMs > 0) metrics.tokensPerSecond = decodeTokens / (decodeMs / 1000);
  if (!usageReliable) {
    metrics.tokenUsagePartial = usageSamples > 0;
    if (usageSamples === 0) {
      metrics.inputTokens = null;
      metrics.outputTokens = null;
      metrics.cacheReadTokens = null;
      metrics.cacheWriteTokens = null;
      metrics.reasoningTokens = null;
    }
  }
  return metrics;
}
function __ch4acko3DshTurnFoldRender(props) {
  var order = props.order;
  var nodeStore = props.nodeStore;
  var timeline = props.timeline;
  var playbackTime = __ch4acko3DshTurnFoldPlaybackTime(timeline);
  var renderNode = props.renderNode;
  var sessionId = props.sessionId;
  var orderPositions = new Map();
  var FOLD_KINDS = {
    "assistant-step": true,
    "context": true,
    "tool-call": true,
    "command": true,
    "manual-compaction": true,
    "compaction": true,
    "model-retry": true
  };
  var plans = new Map();
  var i, key, node, loc, turnNum, plan;
  for (i = 0; i < order.length; i++) {
    key = order[i];
    orderPositions.set(key, i);
    node = nodeStore.get(key);
    if (node === void 0) continue;
    loc = node.location;
    if (loc === void 0 || (loc.kind !== "turn" && loc.kind !== "step")) continue;
    turnNum = loc.turn.turn;
    plan = plans.get(turnNum);
    if (plan === void 0) {
      plan = { turn: turnNum, status: loc.turn.status, endReason: void 0, closingSeq: void 0, closingKey: void 0, closingOrder: -1, closingReasoning: [], tailKey: void 0, branchUnavailable: false, hasAfterClosing: false, hasError: false, activity: [], firstActivityOrder: -1 };
      plans.set(turnNum, plan);
    }
    var endEvent = loc.turn.end;
    if (endEvent !== void 0 && endEvent.data !== void 0 && endEvent.data.reason !== void 0) plan.endReason = endEvent.data.reason.kind;
    if (node.kind === "turn-tail") {
      plan.tailKey = key;
      var closing = node.data === void 0 ? void 0 : node.data.closing;
      if (closing !== null && closing !== void 0 && closing.finalNode !== void 0) plan.closingSeq = closing.finalNode.seq;
      plan.branchUnavailable = node.data !== void 0 && node.data.branchUnavailable === true;
    } else if (node.kind === "turn-error" || node.kind === "turn-max-tokens") {
      plan.hasError = true;
    }
  }
  for (i = 0; i < order.length; i++) {
    key = order[i];
    node = nodeStore.get(key);
    if (node === void 0) continue;
    loc = node.location;
    if (loc === void 0 || (loc.kind !== "turn" && loc.kind !== "step")) continue;
    plan = plans.get(loc.turn.turn);
    if (plan === void 0) continue;
    if (plan.closingSeq !== void 0 && node.kind === "assistant-step" && node.data !== void 0 && node.data.finalNode !== void 0 && node.data.finalNode.seq === plan.closingSeq) {
      plan.closingKey = key;
      plan.closingOrder = i;
      plan.closingReasoning = __ch4acko3DshTurnFoldReasoningTexts(node);
    }
  }
  for (i = 0; i < order.length; i++) {
    key = order[i];
    node = nodeStore.get(key);
    if (node === void 0) continue;
    loc = node.location;
    if (loc === void 0 || (loc.kind !== "turn" && loc.kind !== "step")) continue;
    plan = plans.get(loc.turn.turn);
    if (plan === void 0 || key === plan.closingKey || key === plan.tailKey) continue;
    if (plan.closingOrder >= 0 && i > plan.closingOrder) plan.hasAfterClosing = true;
    if (FOLD_KINDS[node.kind] === true) {
      if (plan.firstActivityOrder < 0) plan.firstActivityOrder = i;
      plan.activity.push(key);
    }
  }
  var entries = [];
  var interactionKeys = __ch4acko3DshTurnFoldInteractionKeys();
  for (i = 0; i < order.length; i++) {
    key = order[i];
    node = nodeStore.get(key);
    if (node === void 0) continue;
    loc = node.location;
    var isTurn = loc !== void 0 && (loc.kind === "turn" || loc.kind === "step");
    plan = isTurn ? plans.get(loc.turn.turn) : void 0;
    var turnFoldKey = plan === void 0 ? null : String(sessionId) + ":" + plan.turn;
    // Preserve an in-progress selection only when folding would newly hide one
    // of its rows. Text already visible inside an open disclosure, or promoted
    // image results that stay outside it, must not dismantle the fold on rerender.
    var interactionBlocksFold = plan !== void 0 && turnFoldKey !== null && !__ch4acko3DshTurnFoldOpenKeys.has(turnFoldKey) && plan.activity.some(function (activityKey) {
      return interactionKeys.has(activityKey) && !__ch4acko3DshTurnFoldIsPromotableImageResult(nodeStore.get(activityKey));
    });
    var foldable = plan !== void 0 && plan.status === "closed" && (plan.endReason === "completed" || plan.endReason === "aborted" || plan.endReason === "interrupted") && !plan.hasError && !plan.branchUnavailable && !plan.hasAfterClosing && plan.closingKey !== void 0 && (plan.activity.length > 0 || plan.closingReasoning.length > 0) && !interactionBlocksFold;
    if (foldable && FOLD_KINDS[node.kind] === true && key !== plan.closingKey) continue;
    var summaryAnchor = plan === void 0 ? void 0 : plan.closingKey !== void 0 && (plan.firstActivityOrder < 0 || plan.closingOrder < plan.firstActivityOrder) ? plan.closingKey : plan.activity[0];
    if (plan !== void 0 && !foldable && summaryAnchor !== void 0 && key === summaryAnchor) {
      entries.push({ type: "element", element: react_jsx_runtime.jsx(__ch4acko3DshTurnFoldSummary, {
        completed: plan.endReason === "completed",
        metrics: __ch4acko3DshTurnFoldPlanMetrics(plan, nodeStore, timeline),
        termination: plan.endReason === "aborted" || plan.endReason === "interrupted" ? plan.endReason : void 0,
        running: plan.status !== "closed" && playbackTime === null,
        settled: plan.status === "closed",
        t: props.t
      }, "ch4acko3-dsh-turn-fold-summary-" + String(sessionId) + "-" + plan.turn) });
    }
    if (foldable && key === plan.closingKey) {
      var promotedImageKeys = plan.activity.filter(function (activityKey) { return __ch4acko3DshTurnFoldIsPromotableImageResult(nodeStore.get(activityKey)); });
      var foldedActivityKeys = plan.activity.filter(function (activityKey) { return promotedImageKeys.indexOf(activityKey) < 0; });
      entries.push({ type: "element", element: react_jsx_runtime.jsx(__ch4acko3DshTurnFoldDisclosure, {
        activity: foldedActivityKeys,
        closingReasoning: plan.closingReasoning,
        completed: plan.endReason === "completed",
        metrics: __ch4acko3DshTurnFoldPlanMetrics(plan, nodeStore, timeline),
        nodeStore: nodeStore,
        orderPositions: orderPositions,
        sessionId: sessionId,
        termination: plan.endReason === "aborted" || plan.endReason === "interrupted" ? plan.endReason : void 0,
        foldKey: turnFoldKey,
        renderNode: renderNode,
        t: props.t
      }, "ch4acko3-dsh-turn-fold-" + String(sessionId) + "-" + plan.turn) });
      for (var promotedImageIndex = 0; promotedImageIndex < promotedImageKeys.length; promotedImageIndex++) {
        entries.push({ type: "element", element: renderNode(promotedImageKeys[promotedImageIndex]) });
      }
    }
    entries.push({
      type: "node",
      key: key,
      node: node,
      order: i,
      closingKey: foldable && key === plan.closingKey && plan.closingReasoning.length > 0 ? "ch4acko3-dsh-turn-fold-closing-" + String(sessionId) + "-" + plan.turn : void 0
    });
  }
  return __ch4acko3DshTurnFoldRenderEntries(entries, nodeStore, renderNode, sessionId, interactionKeys, props.t);
}
`;
