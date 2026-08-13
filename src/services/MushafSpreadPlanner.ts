export const MUSHAF_PAGE_WIDTH_EM = 17;
export const MUSHAF_PAGE_HEIGHT_EM = 27.75;
export const MUSHAF_SPREAD_GUTTER_EM = 0.8;
export const MIN_DUAL_PAGE_FONT_SIZE_PX = 18;

// Current single-page control reservations, preserved exactly when the
// traditional reader layout remains the best available option.
export const STANDARD_READER_TOP_RESERVE_PX = 112;
export const STANDARD_READER_BOTTOM_RESERVE_PX = 96;

// A spread-specific composition recovers vertical area by moving persistent
// controls into a physical side rail. These values are geometry budgets, not
// device breakpoints.
export const SPREAD_READER_TOP_RESERVE_PX = 88;
export const SPREAD_READER_BOTTOM_RESERVE_PX = 24;
export const SPREAD_SIDE_RAIL_WIDTH_PX = 52;
export const SPREAD_SIDE_RAIL_GAP_PX = 12;

export type MushafDisplayMode = 'single' | 'spread';
export type MushafControlLayoutMode = 'standard' | 'side-rail';
export type MushafPageSlotSide = 'single' | 'right' | 'left';

export interface MushafRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MushafPageSlot {
  pageNumber: number;
  side: MushafPageSlotSide;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface MushafSpreadPlan {
  mode: MushafDisplayMode;
  activePage: number;
  anchorPage: number;
  fontSize: number;
  pageWidth: number;
  pageHeight: number;
  gutter: number;
  slots: MushafPageSlot[];
  reason: 'single' | 'insufficient-space' | 'horizontal-hinge' | 'segment-space' | 'spread';
  key: string;
}

export interface MushafSpreadPlannerInput {
  activePage: number;
  viewport: Pick<MushafRect, 'width' | 'height'> & Partial<Pick<MushafRect, 'left' | 'top'>>;
  segments?: MushafRect[];
  hasSeparatingFeature?: boolean;
  minDualFontSize?: number;
  gutterEm?: number;
}

export interface MushafControlLayout {
  mode: MushafControlLayoutMode;
  stage: MushafRect;
  topReserve: number;
  bottomReserve: number;
  sideRail?: MushafRect;
}

export interface MushafAdaptiveSpreadPlan {
  controlLayout: MushafControlLayout;
  spreadPlan: MushafSpreadPlan;
}

function clampPageNumber(pageNumber: number): number {
  return Math.max(1, Math.min(604, Math.round(pageNumber)));
}

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function normalizeViewport(viewport: MushafSpreadPlannerInput['viewport']): MushafRect {
  return {
    left: viewport.left ?? 0,
    top: viewport.top ?? 0,
    width: viewport.width,
    height: viewport.height,
  };
}

function centerPageInRect(pageNumber: number, side: MushafPageSlotSide, rect: MushafRect, fontSize: number): MushafPageSlot {
  const width = MUSHAF_PAGE_WIDTH_EM * fontSize;
  const height = MUSHAF_PAGE_HEIGHT_EM * fontSize;

  return {
    pageNumber,
    side,
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2,
    width,
    height,
    fontSize,
  };
}

function makeSinglePlan(activePage: number, viewport: MushafRect, reason: MushafSpreadPlan['reason']): MushafSpreadPlan {
  const fontSize = Math.min(
    viewport.width / MUSHAF_PAGE_WIDTH_EM,
    viewport.height / MUSHAF_PAGE_HEIGHT_EM,
  );
  const pageWidth = MUSHAF_PAGE_WIDTH_EM * fontSize;
  const pageHeight = MUSHAF_PAGE_HEIGHT_EM * fontSize;
  const slot = centerPageInRect(activePage, 'single', viewport, fontSize);

  return {
    mode: 'single',
    activePage,
    anchorPage: activePage,
    fontSize,
    pageWidth,
    pageHeight,
    gutter: 0,
    slots: [slot],
    reason,
    key: `single-${activePage}`,
  };
}

/**
 * QCF V2 Mushaf pages progress right-to-left in a physical spread:
 * an odd-numbered page occupies the right slot and the following even page
 * occupies the left slot.
 */
export function getMushafSpreadAnchor(activePage: number): number {
  const page = clampPageNumber(activePage);
  return page % 2 === 0 ? page - 1 : page;
}

export function getMushafSpreadPages(activePage: number): { anchorPage: number; rightPage: number; leftPage: number } {
  const anchorPage = getMushafSpreadAnchor(activePage);
  return {
    anchorPage,
    rightPage: anchorPage,
    leftPage: Math.min(604, anchorPage + 1),
  };
}

export function getMushafNavigationTarget(plan: MushafSpreadPlan | null, direction: 'next' | 'previous', activePage: number): number {
  if (!plan || plan.mode === 'single') {
    return clampPageNumber(activePage + (direction === 'next' ? 1 : -1));
  }

  if (direction === 'next' && plan.anchorPage >= 603) return activePage;
  if (direction === 'previous' && plan.anchorPage <= 1) return activePage;

  const delta = direction === 'next' ? 2 : -2;
  return clampPageNumber(plan.anchorPage + delta);
}

function areSideBySide(segments: MushafRect[]): boolean {
  if (segments.length !== 2) return false;
  const [first, second] = segments;
  const verticalOverlap = Math.min(first.top + first.height, second.top + second.height)
    - Math.max(first.top, second.top);
  return verticalOverlap > 0 && Math.abs(first.left - second.left) > 0.5;
}

function planSegmentSpread(
  activePage: number,
  viewport: MushafRect,
  segments: MushafRect[],
  minimumFontSize: number,
): MushafSpreadPlan {
  if (!areSideBySide(segments)) {
    return makeSinglePlan(activePage, viewport, 'horizontal-hinge');
  }

  const [leftSegment, rightSegment] = [...segments].sort((a, b) => a.left - b.left);
  const fontSize = Math.min(
    leftSegment.width / MUSHAF_PAGE_WIDTH_EM,
    leftSegment.height / MUSHAF_PAGE_HEIGHT_EM,
    rightSegment.width / MUSHAF_PAGE_WIDTH_EM,
    rightSegment.height / MUSHAF_PAGE_HEIGHT_EM,
  );

  if (!finitePositive(fontSize) || fontSize < minimumFontSize) {
    return makeSinglePlan(activePage, viewport, 'segment-space');
  }

  const { anchorPage, rightPage, leftPage } = getMushafSpreadPages(activePage);
  const pageWidth = MUSHAF_PAGE_WIDTH_EM * fontSize;
  const pageHeight = MUSHAF_PAGE_HEIGHT_EM * fontSize;

  return {
    mode: 'spread',
    activePage,
    anchorPage,
    fontSize,
    pageWidth,
    pageHeight,
    gutter: Math.max(0, rightSegment.left - (leftSegment.left + leftSegment.width)),
    // DOM order follows the Qur'an page sequence. Slot coordinates are explicit,
    // so visual placement never depends on automatic RTL flex/grid ordering.
    slots: [
      centerPageInRect(rightPage, 'right', rightSegment, fontSize),
      centerPageInRect(leftPage, 'left', leftSegment, fontSize),
    ],
    reason: 'spread',
    key: `spread-${anchorPage}`,
  };
}

function planContinuousSpread(
  activePage: number,
  viewport: MushafRect,
  minimumFontSize: number,
  gutterEm: number,
): MushafSpreadPlan {
  const fontSize = Math.min(
    viewport.width / (MUSHAF_PAGE_WIDTH_EM * 2 + gutterEm),
    viewport.height / MUSHAF_PAGE_HEIGHT_EM,
  );

  if (!finitePositive(fontSize) || fontSize < minimumFontSize) {
    return makeSinglePlan(activePage, viewport, 'insufficient-space');
  }

  const { anchorPage, rightPage, leftPage } = getMushafSpreadPages(activePage);
  const pageWidth = MUSHAF_PAGE_WIDTH_EM * fontSize;
  const pageHeight = MUSHAF_PAGE_HEIGHT_EM * fontSize;
  const gutter = gutterEm * fontSize;
  const totalWidth = pageWidth * 2 + gutter;
  const leftEdge = viewport.left + (viewport.width - totalWidth) / 2;
  const top = viewport.top + (viewport.height - pageHeight) / 2;

  return {
    mode: 'spread',
    activePage,
    anchorPage,
    fontSize,
    pageWidth,
    pageHeight,
    gutter,
    // The odd page is physically on the right, while the next even page is left.
    slots: [
      {
        pageNumber: rightPage,
        side: 'right',
        left: leftEdge + pageWidth + gutter,
        top,
        width: pageWidth,
        height: pageHeight,
        fontSize,
      },
      {
        pageNumber: leftPage,
        side: 'left',
        left: leftEdge,
        top,
        width: pageWidth,
        height: pageHeight,
        fontSize,
      },
    ],
    reason: 'spread',
    key: `spread-${anchorPage}`,
  };
}

/**
 * Produces a fixed-page plan from real available geometry. It never asks CSS to
 * shrink, stretch, or reorder Quran pages; CSS receives only explicit slots.
 */
export function planMushafSpread(input: MushafSpreadPlannerInput): MushafSpreadPlan | null {
  const activePage = clampPageNumber(input.activePage);
  const viewport = normalizeViewport(input.viewport);
  const minimumFontSize = input.minDualFontSize ?? MIN_DUAL_PAGE_FONT_SIZE_PX;
  const gutterEm = input.gutterEm ?? MUSHAF_SPREAD_GUTTER_EM;

  if (!finitePositive(viewport.width) || !finitePositive(viewport.height)) {
    return null;
  }

  const usableSegments = input.segments?.filter((segment) => finitePositive(segment.width) && finitePositive(segment.height)) ?? [];
  if (input.hasSeparatingFeature && usableSegments.length !== 2) {
    // A known fold/hinge with fewer than two usable regions cannot prove a
    // complete safe spread, for example while a pinch-zoom viewport sees one side.
    return makeSinglePlan(activePage, viewport, 'segment-space');
  }
  if (usableSegments.length > 1) {
    return planSegmentSpread(activePage, viewport, usableSegments, minimumFontSize);
  }

  return planContinuousSpread(activePage, viewport, minimumFontSize, gutterEm);
}

function intersectRects(first: MushafRect, second: MushafRect): MushafRect | null {
  const left = Math.max(first.left, second.left);
  const top = Math.max(first.top, second.top);
  const right = Math.min(first.left + first.width, second.left + second.width);
  const bottom = Math.min(first.top + first.height, second.top + second.height);
  if (right <= left || bottom <= top) return null;
  return { left, top, width: right - left, height: bottom - top };
}

function segmentsWithinStage(segments: MushafRect[] | undefined, stage: MushafRect): MushafRect[] | undefined {
  if (!segments) return undefined;
  const clipped = segments
    .map((segment) => intersectRects(segment, stage))
    .filter((segment): segment is MushafRect => segment !== null)
    // MushafSpreadSurface is positioned inside the stage, so planner slots and
    // segment geometry must be stage-local rather than reader-root coordinates.
    .map((segment) => ({
      left: segment.left - stage.left,
      top: segment.top - stage.top,
      width: segment.width,
      height: segment.height,
    }));
  return clipped.length > 0 ? clipped : undefined;
}

function makeStandardControlLayout(viewport: MushafRect): MushafControlLayout {
  return {
    mode: 'standard',
    topReserve: STANDARD_READER_TOP_RESERVE_PX,
    bottomReserve: STANDARD_READER_BOTTOM_RESERVE_PX,
    stage: {
      left: viewport.left,
      top: viewport.top + STANDARD_READER_TOP_RESERVE_PX,
      width: viewport.width,
      height: Math.max(0, viewport.height - STANDARD_READER_TOP_RESERVE_PX - STANDARD_READER_BOTTOM_RESERVE_PX),
    },
  };
}

function makeSideRailControlLayout(viewport: MushafRect): MushafControlLayout {
  const railFootprint = SPREAD_SIDE_RAIL_WIDTH_PX + SPREAD_SIDE_RAIL_GAP_PX;
  const railHeight = Math.max(0, viewport.height - SPREAD_READER_TOP_RESERVE_PX - SPREAD_READER_BOTTOM_RESERVE_PX);

  return {
    mode: 'side-rail',
    topReserve: SPREAD_READER_TOP_RESERVE_PX,
    bottomReserve: SPREAD_READER_BOTTOM_RESERVE_PX,
    sideRail: {
      left: viewport.left,
      top: viewport.top + SPREAD_READER_TOP_RESERVE_PX,
      width: SPREAD_SIDE_RAIL_WIDTH_PX,
      height: railHeight,
    },
    stage: {
      left: viewport.left + railFootprint,
      top: viewport.top + SPREAD_READER_TOP_RESERVE_PX,
      width: Math.max(0, viewport.width - railFootprint),
      height: railHeight,
    },
  };
}

/**
 * Chooses a control composition before choosing the visual page mode. The
 * standard composition remains authoritative whenever it already supports a
 * readable spread; the side rail is used only when it recovers enough real
 * stage area to meet the existing safe Mushaf scale.
 */
export function planAdaptiveMushafSpread(input: MushafSpreadPlannerInput): MushafAdaptiveSpreadPlan | null {
  const viewport = normalizeViewport(input.viewport);
  if (!finitePositive(viewport.width) || !finitePositive(viewport.height)) return null;

  const buildPlan = (controlLayout: MushafControlLayout): MushafSpreadPlan | null => planMushafSpread({
    ...input,
    viewport: {
      left: 0,
      top: 0,
      width: controlLayout.stage.width,
      height: controlLayout.stage.height,
    },
    segments: segmentsWithinStage(input.segments, controlLayout.stage),
  });

  const standardLayout = makeStandardControlLayout(viewport);
  const standardPlan = buildPlan(standardLayout);
  if (!standardPlan) return null;
  if (standardPlan.mode === 'spread') {
    return { controlLayout: standardLayout, spreadPlan: standardPlan };
  }

  const sideRailLayout = makeSideRailControlLayout(viewport);
  const sideRailPlan = buildPlan(sideRailLayout);
  if (sideRailPlan?.mode === 'spread') {
    return { controlLayout: sideRailLayout, spreadPlan: sideRailPlan };
  }

  return { controlLayout: standardLayout, spreadPlan: standardPlan };
}
