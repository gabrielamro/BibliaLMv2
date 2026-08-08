import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const notebook = readFileSync(resolve('components/NotebookAnalysis.tsx'), 'utf8');
const studyContentBlock = readFileSync(resolve('components/Builder/blocks/StudyContentBlock.tsx'), 'utf8');

test('AI analysis and study content use the central public HTML sanitizer when viewed', () => {
  assert.match(notebook, /sanitizePublicHtml\(analysisResult\)/);
  assert.match(studyContentBlock, /sanitizePublicHtml\(data\.content\)/);
});
