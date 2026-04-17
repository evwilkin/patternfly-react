# DRAFT — Do not file until approved

---

**Title:** Tabs overflow does not respond to container resize (only listens to window.resize)

**Labels:** `bug`, `component - Tabs`

---

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

Add a `ResizeObserver` on `this.tabList.current` in `componentDidMount`, alongside the existing `window.resize` listener:

```ts
componentDidMount() {
  if (!this.props.isVertical) {
    if (canUseDOM) {
      window.addEventListener('resize', this.handleResize, false);

      // Observe container size changes (e.g., inside resizable Drawer)
      this.resizeObserver = new ResizeObserver(() => {
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

Consumers can attach their own `ResizeObserver` on the container and force a Tabs remount via a `key` prop:

```tsx
const [resizeKey, setResizeKey] = useState(0);
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver(() => setResizeKey(c => c + 1));
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);

<div ref={containerRef}>
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
