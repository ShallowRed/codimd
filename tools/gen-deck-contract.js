#!/usr/bin/env node
/*
 * gen-deck-contract.js — generate the CodiMD preview's deck-syntax contract from
 * the single source of truth in nuxt-slides (`shared/deck/components.ts`).
 *
 * Why this exists (audit Axe G / item #13): the CodiMD markdown preview used to
 * hand-maintain its OWN list of MDC components, annotation tags and icon rules,
 * which drifted from the slides. This script reads the ONE declarative spec and
 * emits a committed, framework-free JS artifact
 * (`public/js/lib/deck-contract.generated.js`) that `public/js/extra.js`
 * consumes. The webpack build stays pure-JS and has NO build-time dependency on
 * the sibling repo — we only re-run this script (and commit the diff) when the
 * contract changes.
 *
 * Usage:  node tools/gen-deck-contract.js  (or `npm run gen:deck-contract`)
 *
 * The parse is intentionally lightweight (targeted regexes over the .ts source)
 * so we don't need a TypeScript toolchain in this repo. If the contract's shape
 * changes structurally, this script will fail loudly rather than emit a partial
 * artifact.
 */

'use strict'

const fs = require('fs')
const path = require('path')

const CONTRACT_PATH = path.resolve(__dirname, '../../nuxt-slides/shared/deck/components.ts')
const OUTPUT_PATH = path.resolve(__dirname, '../public/js/lib/deck-contract.generated.js')

function fail (msg) {
  console.error('[gen-deck-contract] ' + msg)
  process.exit(1)
}

if (!fs.existsSync(CONTRACT_PATH)) {
  fail('contract not found at ' + CONTRACT_PATH +
    '\n  This generator needs the sibling nuxt-slides repo checked out next to codimd.')
}

const src = fs.readFileSync(CONTRACT_PATH, 'utf8')

// ── Extract DECK_COMPONENTS ──────────────────────────────────────────────
// Each entry looks like: { name: 'Quote' } or
// { name: 'Columns', aliases: ['TwoColumns', 'ThreeColumns'] } or
// { name: 'FullScreenImage', aliases: ['full-screen-image'], fullSlide: true }
function extractArrayBlock (label) {
  const start = src.indexOf(label)
  if (start === -1) fail('could not find `' + label + '` in contract')
  // Anchor on the assignment so a `readonly Type[]` annotation between the name
  // and the `=` doesn't get mistaken for the array literal's opening bracket.
  const eq = src.indexOf('=', start)
  if (eq === -1) fail('could not find `=` after ' + label)
  const open = src.indexOf('[', eq)
  if (open === -1) fail('could not find opening `[` for ' + label)
  // Find matching closing bracket (no nested arrays at top level besides aliases,
  // but be safe and balance brackets).
  let depth = 0
  let end = -1
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++
    else if (src[i] === ']') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end === -1) fail('could not find closing `]` for ' + label)
  return src.slice(open + 1, end)
}

function parseStringList (raw) {
  const out = []
  const re = /['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(raw)) !== null) out.push(m[1])
  return out
}

function parseComponents () {
  const block = extractArrayBlock('DECK_COMPONENTS')
  const components = []
  // Match each `{ ... }` object literal.
  const objRe = /\{([^}]*)\}/g
  let m
  while ((m = objRe.exec(block)) !== null) {
    const body = m[1]
    const nameMatch = body.match(/name:\s*['"]([^'"]+)['"]/)
    if (!nameMatch) fail('component entry without a name: ' + body.trim())
    const comp = { name: nameMatch[1] }

    const compMatch = body.match(/component:\s*['"]([^'"]+)['"]/)
    if (compMatch) comp.component = compMatch[1]

    const aliasesMatch = body.match(/aliases:\s*\[([^\]]*)\]/)
    if (aliasesMatch) comp.aliases = parseStringList(aliasesMatch[1])

    if (/fullSlide:\s*true/.test(body)) comp.fullSlide = true

    components.push(comp)
  }
  if (components.length === 0) fail('parsed zero components from DECK_COMPONENTS')
  return components
}

function parseAnnotations () {
  const block = extractArrayBlock('DECK_ANNOTATIONS')
  const tags = []
  const objRe = /\{([^}]*)\}/g
  let m
  while ((m = objRe.exec(block)) !== null) {
    const tagMatch = m[1].match(/tag:\s*['"]([^'"]+)['"]/)
    if (tagMatch) tags.push(tagMatch[1])
  }
  if (tags.length === 0) fail('parsed zero annotations from DECK_ANNOTATIONS')
  return tags
}

function parseBackgroundTag () {
  const m = src.match(/BACKGROUND_ANNOTATION_TAG\s*=\s*['"]([^'"]+)['"]/)
  if (!m) fail('could not find BACKGROUND_ANNOTATION_TAG')
  return m[1]
}

const components = parseComponents()
const annotationTags = parseAnnotations()
const backgroundTag = parseBackgroundTag()

// Derive flat lists the preview needs.
const componentNames = []
const fullSlideNames = []
for (const c of components) {
  const names = [c.name].concat(c.aliases || [])
  for (const n of names) componentNames.push(n)
  if (c.fullSlide) for (const n of names) fullSlideNames.push(n)
}

// Emit a JS array literal that satisfies `standard` (single quotes, space after
// comma) instead of JSON.stringify's double-quoted output.
function jsArray (arr) {
  return '[' + arr.map(function (s) { return "'" + s + "'" }).join(', ') + ']'
}

// The artifact is authored as ES modules to match the rest of public/js (which
// uses `import`/`export default`). Webpack/babel compiles extra.js as an ESM, so
// a CommonJS `module.exports` artifact would crash at runtime with
// `"exports" is read-only`.
const generated = `/*
 * deck-contract.generated.js — GENERATED, DO NOT EDIT BY HAND.
 *
 * Source of truth: nuxt-slides/shared/deck/components.ts
 * Regenerate with: npm run gen:deck-contract
 *
 * This is the single, shared definition of the deck markdown syntax that the
 * CodiMD preview (public/js/extra.js) consumes, so the preview no longer keeps a
 * third, drifting copy (audit Axe G / item #13).
 */

// Component authoring names (canonical + aliases), e.g. ['Quote', ..., 'Columns',
// 'TwoColumns', 'ThreeColumns', 'IconInline', 'i', ...].
export const COMPONENT_NAMES = ${jsArray(componentNames)}

// Component names that occupy the whole slide (canonical + aliases).
export const FULL_SLIDE_COMPONENT_NAMES = ${jsArray(fullSlideNames)}

// Slide-level annotation tags authored as :tag{...}.
export const ANNOTATION_TAGS = ${jsArray(annotationTags)}

// The annotation extracted on its own pass (carries the background URL).
export const BACKGROUND_ANNOTATION_TAG = '${backgroundTag}'

/*
 * Normalise an icon name to Iconify format ('ri:home-line'). Accepts both the
 * Iconify form (already has ':') and the Remix CSS-class form ('ri-home-line',
 * first hyphen -> colon). Mirrors normalizeIconName() in the contract — the ONE
 * definition of "what is an icon name", ending the ri: vs ri- drift.
 */
export function normalizeIconName (name) {
  if (name.indexOf(':') !== -1) return name
  return name.replace('-', ':')
}

/*
 * Convert any accepted icon name (Iconify 'ri:home-line' OR Remix 'ri-home-line')
 * to the RemixIcon CSS class form the CodiMD preview renders with ('ri-home-line').
 * This is the preview-side counterpart: the contract canonicalises to Iconify,
 * the preview displays via CSS classes, so we accept both and emit the class.
 */
export function iconNameToCssClass (name) {
  return normalizeIconName(name).replace(':', '-')
}
`

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
fs.writeFileSync(OUTPUT_PATH, generated, 'utf8')

console.log('[gen-deck-contract] wrote ' + path.relative(process.cwd(), OUTPUT_PATH))
console.log('  components: ' + componentNames.join(', '))
console.log('  full-slide: ' + (fullSlideNames.join(', ') || '(none)'))
console.log('  annotations: ' + annotationTags.join(', ') + '  (background: ' + backgroundTag + ')')
