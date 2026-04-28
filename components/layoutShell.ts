interface LayoutShellInput {
  pathname: string;
  isFocusMode: boolean;
  isCustomHomeShell: boolean;
  isHeaderHidden: boolean;
}

interface LayoutShellState {
  showMobileShell: boolean;
  showMobileNav: boolean;
  showSidebar: boolean;
  sidebarStartsCollapsed: boolean;
}

const COLLAPSED_SIDEBAR_FOCUS_PATHS = new Set(['/criar-sala']);

export const getLayoutShellState = ({
  pathname,
  isFocusMode,
  isCustomHomeShell,
  isHeaderHidden,
}: LayoutShellInput): LayoutShellState => {
  const shouldShowCollapsedSidebar = COLLAPSED_SIDEBAR_FOCUS_PATHS.has(pathname);

  return {
    showMobileShell: !isFocusMode && !isCustomHomeShell && !isHeaderHidden,
    showMobileNav: !isFocusMode,
    showSidebar: !isFocusMode || shouldShowCollapsedSidebar,
    sidebarStartsCollapsed: shouldShowCollapsedSidebar,
  };
};
