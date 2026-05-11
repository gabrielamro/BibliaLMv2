export type PublicProfileTabId = 'overview' | 'studies' | 'plans';

export interface PublicProfileTab {
  id: PublicProfileTabId;
  label: string;
}

export function getPublicProfileTabs(_params: { isOwner: boolean }): PublicProfileTab[] {
  return [
    { id: 'overview', label: 'Início' },
    { id: 'studies', label: 'Estudos' },
    { id: 'plans', label: 'Jornadas' },
  ];
}
