import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getMissingColumnNameFromError } from '../utils/supabaseErrors.ts';

test('detects missing column from postgres qualified column message', () => {
  const error = {
    code: '42703',
    message: 'column cells.slug does not exist',
  };

  assert.equal(getMissingColumnNameFromError(error), 'slug');
});

test('detects missing column from postgrest schema cache message', () => {
  const error = {
    code: 'PGRST204',
    message: "Could not find the 'privacy' column of 'cells' in the schema cache",
  };

  assert.equal(getMissingColumnNameFromError(error), 'privacy');
});
