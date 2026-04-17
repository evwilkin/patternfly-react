/**
 * PF-3907 — Example 1: Default Overflow (Scroll Buttons) in a Resizable Drawer
 *
 * ROOT CAUSE:
 * PatternFly's Tabs component only listens to `window.resize` events to recalculate
 * overflow state (scroll buttons, accent position). It does NOT use a ResizeObserver
 * on its own container. When Tabs are placed inside a resizable Drawer, dragging the
 * splitter changes the panel's flex-basis via CSS custom properties on every mousemove,
 * but Tabs never learns about the container width change — so scroll buttons and
 * overflow states become stale or erratic.
 *
 * WORKAROUND:
 * Attach a ResizeObserver to the drawer panel. On each resize observation, increment
 * a counter used as the Tabs `key` prop. This forces React to remount Tabs, which
 * triggers componentDidMount → handleScrollButtons() → correct overflow state.
 *
 * TRADE-OFFS:
 * - Remounting Tabs on every resize is heavier than a targeted recalculation, but
 *   Tabs does not expose an imperative API to trigger recalc externally.
 * - The ResizeObserver must filter by WIDTH changes only. Scroll button rendering
 *   changes container height, which re-triggers the observer — creating a feedback
 *   loop that prevents buttons from ever fully settling (render → height changes →
 *   observer fires → remount → repeat). Comparing contentRect.width avoids this.
 *
 * ACCESSIBILITY:
 * - Keyboard navigation through scroll buttons works correctly after remount.
 * - Active tab state is preserved across remounts via controlled `activeKey`.
 *
 * GAP ANALYSIS:
 * 1. No container ResizeObserver in Tabs — only window.resize
 * 2. Drawer onResize fires only on drag-end (mouseup/touchend), not during drag
 * 3. 100ms debounce in Tabs.handleScrollButtons — small lag even when triggered
 * 4. overflowingTabCount accumulates in componentDidUpdate rather than recalculating
 * 5. setAccentStyles recalculates accent position but doesn't scroll active tab into view
 */
import { Fragment, useCallback, useRef, useState } from 'react';
import {
  Drawer,
  DrawerPanelContent,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  DrawerPanelBody,
  Tabs,
  Tab,
  TabTitleText,
  Button,
  Switch
} from '@patternfly/react-core';

export const DrawerTabsScrollOverflow: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [resizeCounter, setResizeCounter] = useState(0);
  const [fixEnabled, setFixEnabled] = useState(true);
  const drawerFocusRef = useRef<HTMLSpanElement>(null);

  // ResizeObserver workaround using a callback ref.
  //
  // Why callback ref instead of useRef + useEffect:
  // DrawerPanelContent delays rendering children until a CSS transition completes
  // (isExpandedInternal is set on transitionEnd). A useEffect keyed on isExpanded
  // runs before the panel DOM exists, so panelRef.current is null and the observer
  // never attaches. A callback ref fires exactly when the DOM node mounts/unmounts.
  //
  // Only triggers on WIDTH changes to avoid a feedback loop where scroll button
  // rendering changes height → observer fires → remount → repeat.
  const lastWidthRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const panelCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Cleanup previous observer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || !fixEnabled) {
        return;
      }

      lastWidthRef.current = 0;
      observerRef.current = new ResizeObserver((entries) => {
        const newWidth = entries[0].contentRect.width;
        if (Math.abs(newWidth - lastWidthRef.current) < 1) {
          return; // Width didn't change — skip (avoids feedback from height changes)
        }
        lastWidthRef.current = newWidth;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setResizeCounter((c) => c + 1);
        }, 150);
      });
      observerRef.current.observe(node);
    },
    [fixEnabled]
  );

  const handleTabClick = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const onResize = (_event: MouseEvent | TouchEvent | React.KeyboardEvent, newWidth: number, id: string) => {
    // eslint-disable-next-line no-console
    console.log(`${id} resized to: ${newWidth}px`);
  };

  const tabs = (
    <Tabs
      key={fixEnabled ? resizeCounter : 'static'}
      activeKey={activeTabKey}
      onSelect={handleTabClick}
      aria-label="Tabs in resizable drawer with scroll overflow"
      role="region"
    >
      <Tab eventKey={0} title={<TabTitleText>Model</TabTitleText>}>
        Model configuration panel
      </Tab>
      <Tab eventKey={1} title={<TabTitleText>Prompt</TabTitleText>}>
        Prompt editor panel
      </Tab>
      <Tab eventKey={2} title={<TabTitleText>Knowledge</TabTitleText>}>
        Knowledge base settings
      </Tab>
      <Tab eventKey={3} title={<TabTitleText>MCP</TabTitleText>}>
        MCP server configuration
      </Tab>
      <Tab eventKey={4} title={<TabTitleText>Parameters</TabTitleText>}>
        Model parameters
      </Tab>
      <Tab eventKey={5} title={<TabTitleText>History</TabTitleText>}>
        Chat history
      </Tab>
      <Tab eventKey={6} title={<TabTitleText>Evaluation</TabTitleText>}>
        Evaluation metrics
      </Tab>
      <Tab eventKey={7} title={<TabTitleText>Export</TabTitleText>}>
        Export settings
      </Tab>
    </Tabs>
  );

  const panelContent = (
    <DrawerPanelContent
      isResizable
      onResize={onResize}
      id="scroll-overflow-panel"
      defaultSize="400px"
      minSize="200px"
      maxSize="900px"
    >
      <div ref={panelCallbackRef}>
        <DrawerHead>
          <span tabIndex={isExpanded ? 0 : -1} ref={drawerFocusRef}>
            Chat Configuration
          </span>
          <DrawerActions>
            <DrawerCloseButton onClick={() => setIsExpanded(false)} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody>{tabs}</DrawerPanelBody>
      </div>
    </DrawerPanelContent>
  );

  return (
    <Fragment>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <Button aria-expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
          Toggle drawer
        </Button>
        <Switch
          id="fix-toggle"
          label={fixEnabled ? 'ResizeObserver fix enabled' : 'ResizeObserver fix disabled (shows bug)'}
          isChecked={fixEnabled}
          onChange={(_event, checked) => setFixEnabled(checked)}
        />
      </div>
      <Drawer isExpanded={isExpanded} onExpand={() => drawerFocusRef.current?.focus()} position="end">
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody>
            <p>
              <strong>Instructions:</strong> Drag the drawer splitter to resize. With the fix disabled, scroll buttons
              become stale — tabs may appear scrollable when they fit, or scroll buttons may disappear when tabs
              overflow. Enable the fix to see correct behavior.
            </p>
            <p style={{ marginTop: '8px' }}>
              Main content area. The drawer panel contains tabs that demonstrate default overflow (scroll button)
              behavior within a resizable container.
            </p>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};
DrawerTabsScrollOverflow.displayName = 'DrawerTabsScrollOverflow';

export default DrawerTabsScrollOverflow;
