export type EditorAspectRatio = 'feed' | 'story';

export const EDITOR_LAYER_Z_INDEX = {
  background: 10,
  frame: 20,
  overlay: 30,
  text: 40,
  drawer: 80,
  dock: 90,
  header: 100,
} as const;

export const DESKTOP_DOCK_POSITION_CLASS = 'md:left-auto md:right-10 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:translate-x-0';
export const MOBILE_DOCK_POSITION_CLASS = 'left-1/2 -translate-x-1/2';
export const FONT_SCALE_LIMITS = {
  min: 0.1,
  max: 4,
  step: 0.1,
} as const;
export const VERSE_FONT_PX_LIMITS = {
  min: 12,
  default: 20,
  max: 96,
} as const;
export const TOP_SEARCH_BAR_WIDTH_CLASS = 'w-full max-w-[520px]';

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

interface ResponsiveTextLayoutInput {
  aspectRatio: EditorAspectRatio;
  containerWidth: number;
  containerHeight: number;
  fontSizeScale: number;
}

interface FontScaleInput {
  aspectRatio: EditorAspectRatio;
  containerWidth: number;
  containerHeight: number;
  targetVerseFontPx: number;
}

function getBaseVerseSize({
  aspectRatio,
  containerWidth,
  containerHeight,
}: Omit<ResponsiveTextLayoutInput, 'fontSizeScale'>) {
  const width = Math.max(containerWidth, 1);
  const height = Math.max(containerHeight, 1);

  return Math.min(
    width * (aspectRatio === 'story' ? 0.062 : 0.074),
    height * (aspectRatio === 'story' ? 0.038 : 0.076)
  );
}

export function getResponsiveTextLayout({
  aspectRatio,
  containerWidth,
  containerHeight,
  fontSizeScale,
}: ResponsiveTextLayoutInput) {
  const baseVerseSize = getBaseVerseSize({
    aspectRatio,
    containerWidth,
    containerHeight,
  });
  const verseFontSizePx = Math.round(clamp(
    baseVerseSize * fontSizeScale,
    VERSE_FONT_PX_LIMITS.min,
    VERSE_FONT_PX_LIMITS.max
  ));
  const referenceFontSizePx = Math.max(10, Math.round(verseFontSizePx * 0.42));
  const referenceGapPx = Math.max(18, Math.round(verseFontSizePx * 0.55));

  return {
    verseFontSizePx,
    referenceFontSizePx,
    referenceGapPx,
    verseLineHeight: 1.22,
    contentWidthPercent: aspectRatio === 'story' ? 88 : 84,
    contentPaddingPx: aspectRatio === 'story' ? 24 : 20,
    maxTextBlockHeightPercent: aspectRatio === 'story' ? 52 : 58,
  };
}

export function getFontScaleFromVersePx({
  aspectRatio,
  containerWidth,
  containerHeight,
  targetVerseFontPx,
}: FontScaleInput) {
  const baseVerseSize = getBaseVerseSize({
    aspectRatio,
    containerWidth,
    containerHeight,
  });

  if (!baseVerseSize) {
    return 1;
  }

  return clamp(targetVerseFontPx, VERSE_FONT_PX_LIMITS.min, VERSE_FONT_PX_LIMITS.max) / baseVerseSize;
}
