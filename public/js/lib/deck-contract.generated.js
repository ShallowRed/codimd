/*
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
export const COMPONENT_NAMES = ['Quote', 'FullScreenImage', 'full-screen-image', 'Iframe', 'Image', 'Mermaid', 'PreviewLink', 'IconInline', 'i', 'Columns', 'TwoColumns', 'ThreeColumns', 'Highlight', 'StoryFrame', 'Screens']

// Component names that occupy the whole slide (canonical + aliases).
export const FULL_SLIDE_COMPONENT_NAMES = ['FullScreenImage', 'full-screen-image']

// Slide-level annotation tags authored as :tag{...}.
export const ANNOTATION_TAGS = ['slide-background', 'pretitle', 'subtitle', 'layout', 'quicklink']

// The annotation extracted on its own pass (carries the background URL).
export const BACKGROUND_ANNOTATION_TAG = 'slide-background'

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
