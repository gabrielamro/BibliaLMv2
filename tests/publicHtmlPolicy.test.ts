import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PUBLIC_HTML_ALLOWED_ATTRIBUTES,
  PUBLIC_HTML_ALLOWED_TAGS,
  PUBLIC_HTML_SANITIZE_OPTIONS,
  isAllowedPublicHtmlUri,
} from '../utils/publicHtmlPolicy.ts';

test('public HTML policy permits only editorial markup and href links', () => {
  assert.ok(PUBLIC_HTML_ALLOWED_TAGS.includes('p'));
  assert.ok(PUBLIC_HTML_ALLOWED_TAGS.includes('a'));
  assert.ok(!PUBLIC_HTML_ALLOWED_TAGS.includes('img'));
  assert.ok(!PUBLIC_HTML_ALLOWED_TAGS.includes('script'));
  assert.deepEqual(PUBLIC_HTML_ALLOWED_ATTRIBUTES, ['href']);
  assert.ok(PUBLIC_HTML_SANITIZE_OPTIONS.FORBID_TAGS.includes('iframe'));
});

test('public HTML policy accepts safe link protocols only', () => {
  assert.equal(isAllowedPublicHtmlUri('https://cultomais.vercel.app'), true);
  assert.equal(isAllowedPublicHtmlUri('mailto:contato@cultomais.vercel.app'), true);
  assert.equal(isAllowedPublicHtmlUri('/estudos'), true);
  assert.equal(isAllowedPublicHtmlUri('javascript:alert(1)'), false);
  assert.equal(isAllowedPublicHtmlUri('data:text/html,test'), false);
});
