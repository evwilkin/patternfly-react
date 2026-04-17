# PF-3907: Overflow Tabs in a Resizable Drawer

## Bug Investigation Summary

### Root Cause

The **erratic scrolling** reported by the Gen AI Studio team is caused by a gap in PatternFly's `Tabs` component: it only recalculates overflow state on `window.resize` events, **not** when its own container changes size. Since the Drawer updates panel width via CSS custom properties (`flex-basis`) on every `mousemove` during drag, Tabs never learns about the width change. This causes:

- Scroll buttons appearing/disappearing incorrectly
- "More" dropdown counts becoming stale
- Active tab accent bar position drifting
- Tabs that fit the container still showing scroll buttons (or vice versa)

This is a **core library limitation**, not an implementation issue in Gen AI Studio.

### Relevant Source Code

| File | Line | Issue |
|------|------|-------|
| `Tabs.tsx` | 381 | Only `window.addEventListener('resize', ...)` — no ResizeObserver |
| `Tabs.tsx` | 258-292 | `handleScrollButtons()` — 100ms debounce, only runs on window resize or child count change |
| `Tabs.tsx` | 429-432 | `overflowingTabCount` accumulates instead of recalculating from scratch |
| `DrawerPanelContent.tsx` | 239 | CSS var updated on every `mousemove` during drag |
| `DrawerPanelContent.tsx` | 250 | `onResize` callback fires only on `mouseup` (drag end) |

### Gap Analysis

1. **No container ResizeObserver** — Tabs only responds to `window.resize`, missing container-level changes from Drawer, CSS Grid, Flexbox, or any parent resize
2. **Drawer `onResize` fires only on drag-end** — no continuous callback during drag, so even manual recalculation would only correct at the end
3. **100ms debounce** — even when triggered, there's a small recalculation lag
4. **Overflow count accumulation bug** — `componentDidUpdate` adds new overflow count to existing count rather than recalculating, which can produce incorrect totals after rapid resizes
5. **No active tab scroll-into-view** — `setAccentStyles()` recalculates the accent bar but doesn't ensure the active tab is scrolled into the visible area after resize
6. **Scroll button rendering causes layout shift** — When scroll buttons appear/disappear, they change the container height, which can re-trigger naive `ResizeObserver` workarounds. Consumers must filter by **width changes only** to avoid a feedback loop
7. **Scroll button space creates false-positive overflow** — Scroll buttons consume ~106px of horizontal space. At widths where all tabs barely fit, the buttons' own space pushes the last tab out of view, keeping buttons permanently visible even when they shouldn't be needed. This is a pre-existing Tabs issue, not specific to the Drawer integration

---

## Solutions

### Example 1: Scroll Button Overflow (`drawer-tabs-scroll-overflow.tsx`)

**Best for:** UIs where users expect to scroll through all tabs sequentially.

Uses default `<Tabs>` behavior (scroll buttons appear when tabs overflow) with a `ResizeObserver` workaround. Includes a toggle to demonstrate the bug vs. the fix.

### Example 2: Horizontal Overflow / "More" Dropdown (`drawer-tabs-horizontal-overflow.tsx`)

**Best for:** Narrow drawer panels where scroll buttons are awkward. Recommended for Gen AI Studio's use case given the constrained panel width.

Uses `<Tabs isOverflowHorizontal={{ showTabCount: true }}>` which renders excess tabs in a "More (N)" dropdown. Same ResizeObserver workaround.

### Example 3: Smart Starting Width (`drawer-tabs-smart-width.tsx`)

**Best for:** When you want the drawer to "fit" its tab content on initial open, avoiding overflow entirely at startup.

Measures total tab width in a hidden container, then sets the drawer's `defaultSize` to fit all tabs. Combines with the ResizeObserver workaround for ongoing resize.

---

## How to Use in CodeSandbox

1. Create a new React + TypeScript sandbox
2. Install PatternFly: `npm install @patternfly/react-core @patternfly/react-styles @patternfly/react-icons`
3. Add PatternFly CSS to your entry point:
   ```tsx
   import '@patternfly/react-core/dist/styles/base.css';
   ```
4. Copy any example file into your `src/` directory
5. Import and render the component in `App.tsx`:
   ```tsx
   import { DrawerTabsScrollOverflow } from './drawer-tabs-scroll-overflow';
   // or
   import { DrawerTabsHorizontalOverflow } from './drawer-tabs-horizontal-overflow';
   // or
   import { DrawerTabsSmartWidth } from './drawer-tabs-smart-width';

   function App() {
     return <DrawerTabsScrollOverflow />;
   }
   ```

---

## Recommendation for Gen AI Studio

Given the screenshot showing tabs (Model, Prompt, Knowledge, MCP) in a relatively narrow drawer panel:

1. **Use `isOverflowHorizontal`** (Example 2) — the "More" dropdown is a better fit for narrow panels than scroll buttons
2. **Apply the ResizeObserver workaround** — essential for correct behavior during drawer resize
3. **Consider smart width** (Example 3) if tab count is known at mount time — prevents overflow on initial open
4. **Watch for PF core fix** — a ResizeObserver addition to Tabs would make the workaround unnecessary

### Workaround Code (minimal)

```tsx
const [resizeKey, setResizeKey] = useState(0);
const lastWidthRef = useRef<number>(0);
const observerRef = useRef<ResizeObserver | null>(null);
const debounceRef = useRef<ReturnType<typeof setTimeout>>();

// IMPORTANT: Must use a callback ref, not useRef + useEffect.
// DrawerPanelContent delays rendering children until a CSS transition completes
// (isExpandedInternal set on transitionEnd). A useEffect keyed on isExpanded runs
// before the panel DOM node exists, so the observer never attaches.
const panelCallbackRef = useCallback((node: HTMLDivElement | null) => {
  clearTimeout(debounceRef.current);
  observerRef.current?.disconnect();
  observerRef.current = null;
  if (!node) return;

  lastWidthRef.current = 0;
  // Only trigger on WIDTH changes — height changes from scroll button rendering
  // would cause a feedback loop (render → height changes → observer → remount → repeat).
  observerRef.current = new ResizeObserver((entries) => {
    const newWidth = entries[0].contentRect.width;
    if (Math.abs(newWidth - lastWidthRef.current) < 1) return;
    lastWidthRef.current = newWidth;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setResizeKey(c => c + 1), 150);
  });
  observerRef.current.observe(node);
}, []);

// In your DrawerPanelContent:
<div ref={panelCallbackRef}>
  <Tabs key={resizeKey} activeKey={activeKey} onSelect={handleSelect}>
    {/* tabs */}
  </Tabs>
</div>
```
