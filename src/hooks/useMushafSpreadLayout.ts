import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MIN_DUAL_PAGE_FONT_SIZE_PX,
  MUSHAF_SPREAD_GUTTER_EM,
  planAdaptiveMushafSpread,
} from '@/services/MushafSpreadPlanner';
import type { MushafControlLayout, MushafRect, MushafSpreadPlan } from '@/services/MushafSpreadPlanner';

type SegmentCapableViewport = VisualViewport & {
  segments?: ReadonlyArray<DOMRectReadOnly>;
};

type SegmentCapableWindow = Window & {
  viewport?: {
    segments?: ReadonlyArray<DOMRectReadOnly>;
  };
  visualViewport?: SegmentCapableViewport | null;
};

interface MushafSpreadGeometry {
  viewport: MushafRect;
  segments?: MushafRect[];
  hasSeparatingFeature: boolean;
}

interface SegmentMeasurement {
  segments?: MushafRect[];
  hasSeparatingFeature: boolean;
}

export interface UseMushafSpreadLayoutOptions {
  minDualFontSize?: number;
  gutterEm?: number;
  // UI state does not directly resize a page; it is an explicit recomputation
  // trigger when a control changes visibility or behavior.
  layoutVersion?: string;
}

function sameNumber(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.25;
}

function sameRect(left: MushafRect, right: MushafRect): boolean {
  return sameNumber(left.left, right.left)
    && sameNumber(left.top, right.top)
    && sameNumber(left.width, right.width)
    && sameNumber(left.height, right.height);
}

function sameGeometry(left: MushafSpreadGeometry | null, right: MushafSpreadGeometry): boolean {
  if (!left || !sameRect(left.viewport, right.viewport) || left.hasSeparatingFeature !== right.hasSeparatingFeature) return false;
  if ((left.segments?.length ?? 0) !== (right.segments?.length ?? 0)) return false;
  return (left.segments ?? []).every((segment, index) => sameRect(segment, right.segments?.[index] ?? segment));
}

function intersectRects(
  first: Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom'>,
  second: Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom'>,
): MushafRect | null {
  const left = Math.max(first.left, second.left);
  const top = Math.max(first.top, second.top);
  const right = Math.min(first.right, second.right);
  const bottom = Math.min(first.bottom, second.bottom);
  if (right <= left || bottom <= top) return null;
  return { left, top, width: right - left, height: bottom - top };
}

function visibleContainerRect(container: DOMRect): MushafRect {
  const visualViewport = window.visualViewport;
  // Standard desktop zoom changes CSS layout dimensions and is handled by the
  // ResizeObserver. Pinch zoom changes only the visual viewport, so restrict
  // the geometry to the actually visible portion of the reader as well.
  if (!visualViewport || visualViewport.scale <= 1.001) {
    return {
      left: container.left,
      top: container.top,
      width: container.width,
      height: container.height,
    };
  }

  const visualRect = {
    left: visualViewport.offsetLeft,
    top: visualViewport.offsetTop,
    right: visualViewport.offsetLeft + visualViewport.width,
    bottom: visualViewport.offsetTop + visualViewport.height,
  };
  const visible = intersectRects(container, visualRect);
  return visible ?? {
    left: container.left,
    top: container.top,
    width: container.width,
    height: container.height,
  };
}

function readViewportSegments(container: DOMRect, visible: MushafRect): SegmentMeasurement {
  const viewportWindow = window as SegmentCapableWindow;
  const rawSegments = viewportWindow.viewport?.segments ?? viewportWindow.visualViewport?.segments;
  if (!rawSegments || rawSegments.length <= 1) {
    return { hasSeparatingFeature: false };
  }

  const visibleRect = {
    left: visible.left,
    top: visible.top,
    right: visible.left + visible.width,
    bottom: visible.top + visible.height,
  };

  const segments = Array.from(rawSegments)
    .map((segment) => {
      const inContainer = intersectRects(segment, container);
      if (!inContainer) return null;
      const inVisibleArea = intersectRects({
        left: inContainer.left,
        top: inContainer.top,
        right: inContainer.left + inContainer.width,
        bottom: inContainer.top + inContainer.height,
      }, visibleRect);
      if (!inVisibleArea) return null;
      return {
        left: inVisibleArea.left - container.left,
        top: inVisibleArea.top - container.top,
        width: inVisibleArea.width,
        height: inVisibleArea.height,
      };
    })
    .filter((segment): segment is MushafRect => segment !== null)
    .sort((left, right) => left.left - right.left || left.top - right.top);

  return {
    segments: segments.length > 0 ? segments : undefined,
    hasSeparatingFeature: true,
  };
}

/**
 * Observes the real content rectangle reserved for the Mushaf. The result is a
 * geometry plan, not a viewport breakpoint: resizing, split-screen, visual
 * viewport zoom, and posture changes all run through the same calculation.
 */
export function useMushafSpreadLayout(
  activePage: number,
  options: UseMushafSpreadLayoutOptions = {},
): {
  setViewportRef: (element: HTMLDivElement | null) => void;
  plan: MushafSpreadPlan | null;
  controlLayout: MushafControlLayout | null;
} {
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const [geometry, setGeometry] = useState<MushafSpreadGeometry | null>(null);
  const animationFrame = useRef<number | null>(null);

  const setViewportRef = useCallback((element: HTMLDivElement | null) => {
    setViewportElement((current) => (current === element ? current : element));
  }, []);

  useEffect(() => {
    if (!viewportElement) return;

    const updateGeometry = () => {
      const container = viewportElement.getBoundingClientRect();
      const visible = visibleContainerRect(container);
      const localViewport: MushafRect = {
        left: visible.left - container.left,
        top: visible.top - container.top,
        width: Math.min(visible.width, viewportElement.clientWidth),
        height: Math.min(visible.height, viewportElement.clientHeight),
      };
      const segmentMeasurement = readViewportSegments(container, visible);
      const next: MushafSpreadGeometry = {
        viewport: localViewport,
        segments: segmentMeasurement.segments,
        hasSeparatingFeature: segmentMeasurement.hasSeparatingFeature,
      };
      setGeometry((current) => (sameGeometry(current, next) ? current : next));
    };

    const scheduleGeometryUpdate = () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(() => {
        animationFrame.current = null;
        updateGeometry();
      });
    };

    updateGeometry();

    const observer = new ResizeObserver(scheduleGeometryUpdate);
    observer.observe(viewportElement);
    window.addEventListener('resize', scheduleGeometryUpdate);

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', scheduleGeometryUpdate);
    visualViewport?.addEventListener('scroll', scheduleGeometryUpdate);

    const orientation = window.screen?.orientation;
    orientation?.addEventListener?.('change', scheduleGeometryUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleGeometryUpdate);
      visualViewport?.removeEventListener('resize', scheduleGeometryUpdate);
      visualViewport?.removeEventListener('scroll', scheduleGeometryUpdate);
      orientation?.removeEventListener?.('change', scheduleGeometryUpdate);
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [viewportElement]);

  const adaptivePlan = useMemo(() => {
    if (!geometry) return null;
    return planAdaptiveMushafSpread({
      activePage,
      viewport: geometry.viewport,
      segments: geometry.segments,
      hasSeparatingFeature: geometry.hasSeparatingFeature,
      minDualFontSize: options.minDualFontSize ?? MIN_DUAL_PAGE_FONT_SIZE_PX,
      gutterEm: options.gutterEm ?? MUSHAF_SPREAD_GUTTER_EM,
    });
  }, [activePage, geometry, options.gutterEm, options.layoutVersion, options.minDualFontSize]);

  return {
    setViewportRef,
    plan: adaptivePlan?.spreadPlan ?? null,
    controlLayout: adaptivePlan?.controlLayout ?? null,
  };
}
