import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  DESKTOP_DOCK_POSITION_CLASS,
  EDITOR_LAYER_Z_INDEX,
  VERSE_FONT_PX_LIMITS,
  getFontScaleFromVersePx,
  getResponsiveTextLayout,
} from '../app/criar-arte-sacra/editorLayout.ts';

test('editor chrome layers always stay above draggable canvas layers', () => {
  assert.ok(
    EDITOR_LAYER_Z_INDEX.drawer > EDITOR_LAYER_Z_INDEX.text,
    'drawer should render above text layer'
  );

  assert.ok(
    EDITOR_LAYER_Z_INDEX.dock > EDITOR_LAYER_Z_INDEX.text,
    'dock should render above text layer'
  );
});

test('responsive text layout derives sizes from canvas dimensions with sane clamps', () => {
  const compactFeed = getResponsiveTextLayout({
    aspectRatio: 'feed',
    containerWidth: 380,
    containerHeight: 380,
    fontSizeScale: 1,
  });

  const roomyStory = getResponsiveTextLayout({
    aspectRatio: 'story',
    containerWidth: 360,
    containerHeight: 1100,
    fontSizeScale: 1.2,
  });

  assert.equal(compactFeed.verseFontSizePx, 28);
  assert.equal(compactFeed.referenceFontSizePx, 16);
  assert.equal(compactFeed.contentWidthPercent, 84);
  assert.equal(roomyStory.contentWidthPercent, 88);

  assert.ok(roomyStory.verseFontSizePx > compactFeed.verseFontSizePx);
  assert.ok(roomyStory.referenceFontSizePx > compactFeed.referenceFontSizePx);
  assert.ok(roomyStory.verseFontSizePx <= 52);
  assert.ok(roomyStory.referenceFontSizePx <= 28);
});

test('desktop dock alignment uses the right rail instead of centered positioning', () => {
  assert.match(DESKTOP_DOCK_POSITION_CLASS, /md:right-8/);
  assert.doesNotMatch(DESKTOP_DOCK_POSITION_CLASS, /md:left-1\/2/);
});

test('font size conversion maps a target pixel size back to an editor scale', () => {
  const scale = getFontScaleFromVersePx({
    aspectRatio: 'feed',
    containerWidth: 380,
    containerHeight: 380,
    targetVerseFontPx: 42,
  });

  const layout = getResponsiveTextLayout({
    aspectRatio: 'feed',
    containerWidth: 380,
    containerHeight: 380,
    fontSizeScale: scale,
  });

  assert.equal(layout.verseFontSizePx, 42);
});

test('font size helpers respect the new 20px minimum and 24px default', () => {
  const defaultScale = getFontScaleFromVersePx({
    aspectRatio: 'feed',
    containerWidth: 380,
    containerHeight: 380,
    targetVerseFontPx: VERSE_FONT_PX_LIMITS.default,
  });

  const defaultLayout = getResponsiveTextLayout({
    aspectRatio: 'feed',
    containerWidth: 380,
    containerHeight: 380,
    fontSizeScale: defaultScale,
  });

  const minScale = getFontScaleFromVersePx({
    aspectRatio: 'feed',
    containerWidth: 380,
    containerHeight: 380,
    targetVerseFontPx: 12,
  });

  const minLayout = getResponsiveTextLayout({
    aspectRatio: 'feed',
    containerWidth: 380,
    containerHeight: 380,
    fontSizeScale: minScale,
  });

  assert.equal(defaultLayout.verseFontSizePx, VERSE_FONT_PX_LIMITS.default);
  assert.equal(minLayout.verseFontSizePx, VERSE_FONT_PX_LIMITS.min);
});
