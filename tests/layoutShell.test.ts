import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getLayoutShellState } from '../components/layoutShell.ts';

test('old journey creator route is no longer a collapsed focus route', () => {
  const shell = getLayoutShellState({
    pathname: '/criador-jornada',
    isFocusMode: true,
    isCustomHomeShell: false,
    isHeaderHidden: true,
  });

  assert.equal(shell.showSidebar, false);
  assert.equal(shell.sidebarStartsCollapsed, false);
  assert.equal(shell.showMobileNav, false);
});

test('room creator keeps the application menu visible in collapsed mode during focus editing', () => {
  const shell = getLayoutShellState({
    pathname: '/criar-sala',
    isFocusMode: true,
    isCustomHomeShell: false,
    isHeaderHidden: true,
  });

  assert.equal(shell.showSidebar, true);
  assert.equal(shell.sidebarStartsCollapsed, true);
  assert.equal(shell.showMobileNav, false);
});

test('regular focus mode still hides the application menu', () => {
  const shell = getLayoutShellState({
    pathname: '/criar-conteudo',
    isFocusMode: true,
    isCustomHomeShell: false,
    isHeaderHidden: true,
  });

  assert.equal(shell.showSidebar, false);
  assert.equal(shell.sidebarStartsCollapsed, false);
  assert.equal(shell.showMobileNav, false);
});
