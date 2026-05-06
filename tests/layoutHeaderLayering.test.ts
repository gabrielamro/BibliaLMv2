import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/Layout.tsx', 'utf8');

test('desktop app header stays above room cover hero and its settings menu', () => {
  assert.match(source, /hidden md:flex[\s\S]*sticky top-0[\s\S]*z-\[120\]/);
  assert.match(source, /desktopSettingsRef[\s\S]*z-\[130\]/);
});

test('mobile app header settings menu also renders above page hero media', () => {
  assert.match(source, /md:hidden[\s\S]*z-\[120\]/);
  assert.match(source, /settingsRef[\s\S]*z-\[130\]/);
});
