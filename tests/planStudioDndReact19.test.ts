import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('plan studio avoids @hello-pangea/dnd because it breaks with React 19 internals', () => {
  const source = readFileSync('components/PlanStudio/LessonStructurePanel.tsx', 'utf8');

  assert.doesNotMatch(source, /@hello-pangea\/dnd/);
  assert.match(source, /@dnd-kit\/core/);
  assert.match(source, /@dnd-kit\/sortable/);
});
