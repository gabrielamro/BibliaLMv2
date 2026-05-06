import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  buildCreateContentShortcutUrl,
  getContentDefaultsFromSearchParams,
  resolveGroupVisibilitySelection,
} from '../utils/contentPrivacy.ts';

test('getContentDefaultsFromSearchParams preselects church visibility', () => {
  const params = new URLSearchParams('scope=church&churchId=church-1&churchName=Central');

  const defaults = getContentDefaultsFromSearchParams(params);

  assert.equal(defaults.visibility, 'church');
  assert.equal(defaults.churchId, 'church-1');
  assert.equal(defaults.contextLabel, 'Central');
});

test('getContentDefaultsFromSearchParams preselects group visibility', () => {
  const params = new URLSearchParams('scope=group&churchId=church-1&groupId=group-1&groupName=Jovens');

  const defaults = getContentDefaultsFromSearchParams(params);

  assert.equal(defaults.visibility, 'group');
  assert.equal(defaults.churchId, 'church-1');
  assert.equal(defaults.groupId, 'group-1');
  assert.equal(defaults.contextLabel, 'Jovens');
});

test('buildCreateContentShortcutUrl carries church/group context to creators', () => {
  const url = buildCreateContentShortcutUrl('/criar-sala', {
    scope: 'group',
    churchId: 'church-1',
    churchName: 'Central',
    groupId: 'group-1',
    groupName: 'Jovens',
  });

  assert.equal(
    url,
    '/criar-sala?scope=group&churchId=church-1&churchName=Central&groupId=group-1&groupName=Jovens',
  );
});

test('resolveGroupVisibilitySelection stores the selected user groups for room privacy', () => {
  assert.deepEqual(resolveGroupVisibilitySelection('group', ['group-2', 'group-3']), {
    groupId: 'group-2',
    allowedGroupIds: ['group-2'],
  });

  assert.deepEqual(resolveGroupVisibilitySelection('church_groups', ['group-2', 'group-3']), {
    groupId: 'group-2',
    allowedGroupIds: ['group-2', 'group-3'],
  });

  assert.deepEqual(resolveGroupVisibilitySelection('church', ['group-2']), {
    groupId: undefined,
    allowedGroupIds: [],
  });
});
