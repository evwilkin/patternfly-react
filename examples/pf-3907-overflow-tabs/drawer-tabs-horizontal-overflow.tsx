/**
 * PF-3907 — Example 2: Horizontal Overflow ("More" Dropdown) in a Resizable Drawer
 *
 * This example uses `isOverflowHorizontal` on Tabs, which renders excess tabs in a
 * "More (N)" dropdown menu instead of scroll buttons. This is often a better UX for
 * constrained spaces like drawer panels.
 *
 * SAME ROOT CAUSE as Example 1:
 * Tabs only listens to window.resize, not container resize. The "More" dropdown count
 * (`overflowingTabCount`) is calculated via `countOverflowingElements()` which checks
 * `isElementInView()` using getBoundingClientRect — but this check only runs on
 * window resize or child count change, not on container width change.
 *
 * WORKAROUND:
 * Same ResizeObserver + key remount approach. When the drawer panel resizes, we force
 * Tabs to remount so it recalculates which tabs fit and how many go into "More".
 *
 * ADDITIONAL NOTE on overflowingTabCount accumulation:
 * In Tabs.componentDidUpdate (line ~429), the overflow count is accumulated:
 *   overflowingTabCount = currentOverflowingTabCount + previousOverflowingTabCount
 * This means rapid resizes without remount can produce incorrect counts. The key-based
 * remount avoids this by starting fresh each time.
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

export const DrawerTabsHorizontalOverflow: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [resizeCounter, setResizeCounter] = useState(0);
  const [fixEnabled, setFixEnabled] = useState(true);
  const drawerFocusRef = useRef<HTMLSpanElement>(null);

  // Callback ref — see Example 1 comments for why useRef+useEffect doesn't work here.
  const lastWidthRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const panelCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
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
          return;
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
      aria-label="Tabs in resizable drawer with horizontal overflow"
      role="region"
      isOverflowHorizontal={{ showTabCount: true, defaultTitleText: 'More' }}
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
      id="horizontal-overflow-panel"
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
          id="fix-toggle-horizontal"
          label={fixEnabled ? 'ResizeObserver fix enabled' : 'ResizeObserver fix disabled (shows bug)'}
          isChecked={fixEnabled}
          onChange={(_event, checked) => setFixEnabled(checked)}
        />
      </div>
      <Drawer isExpanded={isExpanded} onExpand={() => drawerFocusRef.current?.focus()} position="end">
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody>
            <p>
              <strong>Instructions:</strong> Drag the drawer splitter to resize. The &quot;More (N)&quot; dropdown
              should update its count as the panel width changes. With the fix disabled, the count becomes stale or
              incorrect after resizing. Enable the fix to see the count adapt in real-time.
            </p>
            <p style={{ marginTop: '8px' }}>
              This example uses <code>isOverflowHorizontal</code> which renders excess tabs in a dropdown menu instead
              of scroll buttons — often a better fit for narrow drawer panels.
            </p>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};
DrawerTabsHorizontalOverflow.displayName = 'DrawerTabsHorizontalOverflow';

export default DrawerTabsHorizontalOverflow;
