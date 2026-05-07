# Tabs overflow does not respond to container resize (only listens to window.resize)

## Description

The `Tabs` component only recalculates its overflow state (scroll buttons and "More" dropdown count) in response to `window.resize` events. It does not observe its own container for size changes. This means that when Tabs are placed inside any dynamically-sized container — such as a resizable `Drawer`, a CSS Grid/Flexbox layout that redistributes space, or a collapsible sidebar — the overflow state becomes stale:

- Scroll buttons appear when all tabs fit, or disappear when tabs overflow
- The "More (N)" dropdown count does not update
- The active tab accent bar drifts out of position

## Root Cause

In `Tabs.tsx`, `componentDidMount` (line 381) registers only:

```ts
window.addEventListener('resize', this.handleResize, false);
```

There is no `ResizeObserver` on `this.tabList.current` (the `<ul>` element), so container-level width changes are invisible to the component.

Additionally, `handleScrollButtons()` (line 258) uses a 100ms debounce and `componentDidUpdate` (line 429) accumulates `overflowingTabCount` rather than recalculating from scratch, which can compound errors during rapid resizes.

## Steps to Reproduce

1. Place a `<Tabs>` component with 8+ tabs inside a `<DrawerPanelContent isResizable>`
2. Open the drawer — tabs may display correctly initially
3. Drag the drawer splitter to make the panel narrower
4. **Expected:** Scroll buttons appear / "More" count increases as tabs overflow
5. **Actual:** Overflow state is unchanged until the browser window itself is resized

This also reproduces with any non-window container resize (e.g., a parent element resized via JavaScript, CSS transitions, or layout shifts).

## Proposed Fix

Add a `ResizeObserver` on `this.tabList.current` in `componentDidMount`, alongside the existing `window.resize` listener. The observer should filter by **width changes only** — when scroll buttons render/hide, they change the container height, which would re-trigger the observer and create a feedback loop.

```ts
// New instance property
private resizeObserver: ResizeObserver | null = null;
private lastObservedWidth: number = 0;

componentDidMount() {
  if (!this.props.isVertical) {
    if (canUseDOM) {
      window.addEventListener('resize', this.handleResize, false);

      // Observe container size changes (e.g., inside resizable Drawer)
      this.resizeObserver = new ResizeObserver((entries) => {
        const newWidth = entries[0].contentRect.width;
        // Only react to WIDTH changes — scroll button rendering changes height,
        // which would cause an infinite feedback loop if not filtered out.
        if (Math.abs(newWidth - this.lastObservedWidth) < 1) {
          return;
        }
        this.lastObservedWidth = newWidth;
        this.handleResize();
      });
      if (this.tabList.current) {
        this.resizeObserver.observe(this.tabList.current);
      }
    }
    this.direction = getLanguageDirection(this.tabList.current);
    this.handleScrollButtons();
  }
  this.setAccentStyles(true);
}

componentWillUnmount() {
  if (!this.props.isVertical) {
    if (canUseDOM) {
      window.removeEventListener('resize', this.handleResize, false);
      this.resizeObserver?.disconnect();
    }
  }
  // ...existing cleanup
}
```

This would fix Tabs in any dynamically-sized container, not just Drawer.

## Current Workaround

Consumers can work around this by attaching their own `ResizeObserver` and forcing a Tabs remount via a `key` prop. However, the workaround has three non-obvious pitfalls:

1. **Must use a callback ref, not `useRef` + `useEffect`** — `DrawerPanelContent` delays rendering children until a CSS transition completes (`isExpandedInternal` is set on `transitionEnd`). A `useEffect` keyed on `isExpanded` runs before the panel DOM node exists, so the observer never attaches after a drawer toggle.

2. **Must filter by width changes only** — When scroll buttons appear/disappear, they change the container height. A naive `ResizeObserver` callback re-triggers on height changes, causing an infinite remount loop (buttons render → height changes → observer fires → remount → repeat).

3. **Must debounce to ~150ms** — Tabs internally uses a 100ms debounce in `handleScrollButtons()` and a 100ms delay for `showScrollButtons`. The consumer's debounce must be longer than these to avoid interfering with the multi-phase scroll button rendering cycle.

```tsx
const [resizeKey, setResizeKey] = useState(0);
const lastWidthRef = useRef<number>(0);
const observerRef = useRef<ResizeObserver | null>(null);
const debounceRef = useRef<ReturnType<typeof setTimeout>>();

const panelCallbackRef = useCallback((node: HTMLDivElement | null) => {
  clearTimeout(debounceRef.current);
  observerRef.current?.disconnect();
  observerRef.current = null;
  if (!node) return;

  lastWidthRef.current = 0;
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
    {/* ... */}
  </Tabs>
</div>
```

## Environment

- `@patternfly/react-core` version: current main
- Browsers: all (ResizeObserver is widely supported)

## Related

- Jira: PF-3907
