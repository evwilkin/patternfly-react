/**
 * PF-3907 — Example 3: Smart Starting Width for Drawer Based on Tab Content
 *
 * This example calculates an ideal starting width for the drawer panel so that all
 * tabs are visible without overflow on initial render. It uses a two-phase approach:
 *
 * PHASE 1 — Measure:
 *   Render the Tabs in a hidden measurement container to determine total tab width.
 *   Use this measurement to set the drawer's `defaultSize`.
 *
 * PHASE 2 — Ongoing resize:
 *   Same ResizeObserver workaround from Examples 1 & 2 to keep tabs responsive when
 *   the user drags the splitter.
 *
 * WHEN TO USE THIS APPROACH:
 * - When tab count is known at mount time and you want to avoid overflow entirely
 * - When the drawer should "fit" its tab content rather than use a fixed width
 * - Combine with minSize/maxSize to clamp to reasonable bounds
 *
 * LIMITATIONS:
 * - Measurement requires tabs to render once (even if hidden) before the drawer opens
 * - Dynamic tab additions after mount won't re-measure unless you trigger it
 * - Tab widths depend on font loading; if fonts load async, measurement may be slightly off
 */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
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
  Button
} from '@patternfly/react-core';

// Padding to add around the measured tab width for drawer chrome (close button, padding, splitter)
const DRAWER_CHROME_PADDING = 80;
const MIN_DRAWER_WIDTH = 250;
const MAX_DRAWER_WIDTH = 900;

interface TabDefinition {
  eventKey: number;
  title: string;
  content: string;
}

const defaultTabs: TabDefinition[] = [
  { eventKey: 0, title: 'Model', content: 'Model configuration panel' },
  { eventKey: 1, title: 'Prompt', content: 'Prompt editor panel' },
  { eventKey: 2, title: 'Knowledge', content: 'Knowledge base settings' },
  { eventKey: 3, title: 'MCP', content: 'MCP server configuration' },
  { eventKey: 4, title: 'Parameters', content: 'Model parameters' }
];

const extendedTabs: TabDefinition[] = [
  ...defaultTabs,
  { eventKey: 5, title: 'History', content: 'Chat history' },
  { eventKey: 6, title: 'Evaluation', content: 'Evaluation metrics' },
  { eventKey: 7, title: 'Export', content: 'Export settings' }
];

export const DrawerTabsSmartWidth: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [resizeCounter, setResizeCounter] = useState(0);
  const [tabs, setTabs] = useState<TabDefinition[]>(defaultTabs);
  const [drawerWidth, setDrawerWidth] = useState<string>('500px');
  const measureRef = useRef<HTMLDivElement>(null);
  const drawerFocusRef = useRef<HTMLSpanElement>(null);

  // Measure total tab width and calculate ideal drawer size
  const measureAndSetWidth = useCallback(() => {
    if (!measureRef.current) {
      return;
    }
    const tabList = measureRef.current.querySelector('ul');
    if (!tabList) {
      return;
    }
    const tabElements = Array.from(tabList.children);
    const totalTabWidth = tabElements.reduce((sum, el) => sum + (el as HTMLElement).offsetWidth, 0);
    const idealWidth = Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, totalTabWidth + DRAWER_CHROME_PADDING));
    setDrawerWidth(`${idealWidth}px`);
  }, []);

  // Measure after tabs render in the hidden container
  useEffect(() => {
    // Use requestAnimationFrame to ensure the hidden tabs have rendered and painted
    const rafId = requestAnimationFrame(() => {
      measureAndSetWidth();
    });
    return () => cancelAnimationFrame(rafId);
  }, [tabs, measureAndSetWidth]);

  // Callback ref for ResizeObserver — same pattern as Examples 1 & 2.
  const lastWidthRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const panelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) {
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
  }, []);

  const handleTabClick = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  const onResize = (_event: MouseEvent | TouchEvent | React.KeyboardEvent, newWidth: number, id: string) => {
    // eslint-disable-next-line no-console
    console.log(`${id} resized to: ${newWidth}px`);
  };

  const tabElements = tabs.map((tab) => (
    <Tab key={tab.eventKey} eventKey={tab.eventKey} title={<TabTitleText>{tab.title}</TabTitleText>}>
      {tab.content}
    </Tab>
  ));

  const panelContent = (
    <DrawerPanelContent
      isResizable
      onResize={onResize}
      id="smart-width-panel"
      defaultSize={drawerWidth}
      minSize={`${MIN_DRAWER_WIDTH}px`}
      maxSize={`${MAX_DRAWER_WIDTH}px`}
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
        <DrawerPanelBody>
          <Tabs
            key={resizeCounter}
            activeKey={activeTabKey}
            onSelect={handleTabClick}
            aria-label="Tabs in smart-width resizable drawer"
            role="region"
          >
            {tabElements}
          </Tabs>
        </DrawerPanelBody>
      </div>
    </DrawerPanelContent>
  );

  return (
    <Fragment>
      {/* Hidden measurement container — renders tabs off-screen to measure total width */}
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          height: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      >
        <Tabs activeKey={activeTabKey} aria-label="Measurement tabs" role="region">
          {tabElements}
        </Tabs>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <Button aria-expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
          Toggle drawer
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setTabs(tabs.length === defaultTabs.length ? extendedTabs : defaultTabs);
            setActiveTabKey(0);
          }}
        >
          {tabs.length === defaultTabs.length ? 'Add more tabs (8 total)' : 'Fewer tabs (5 total)'}
        </Button>
        <span>
          Calculated width: <strong>{drawerWidth}</strong>
        </span>
      </div>
      <Drawer isExpanded={isExpanded} onExpand={() => drawerFocusRef.current?.focus()} position="end">
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody>
            <p>
              <strong>Instructions:</strong> The drawer width is automatically calculated to fit all tabs. Click
              &quot;Add more tabs&quot; to see the width adjust. You can still drag-resize, and tabs will adapt thanks
              to the ResizeObserver fix.
            </p>
            <p style={{ marginTop: '8px' }}>
              <strong>How it works:</strong> Tabs are rendered in a hidden off-screen container. After paint, we measure
              total tab width and set the drawer&apos;s <code>defaultSize</code> accordingly, clamped between{' '}
              {MIN_DRAWER_WIDTH}px and {MAX_DRAWER_WIDTH}px.
            </p>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};
DrawerTabsSmartWidth.displayName = 'DrawerTabsSmartWidth';

export default DrawerTabsSmartWidth;
