export type ContentIdentityKind = 'study' | 'room' | 'default';

export type ContentIdentity = {
  kind: ContentIdentityKind;
  label: string;
  accent: string;
  surface: string;
  border: string;
  hoverBorder: string;
  primaryButton: string;
  secondaryButton: string;
  softButton: string;
  focusRing: string;
  heroGradient: string;
  shadow: string;
};

export const roomIdentity: ContentIdentity = {
  kind: 'room',
  label: 'Sala do Reino',
  accent: 'text-purple-700 dark:text-violet-300',
  surface: 'bg-purple-50 dark:bg-purple-950/20',
  border: 'border-purple-200 dark:border-purple-800/50',
  hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-500',
  primaryButton: 'bg-purple-700 text-white shadow-lg shadow-purple-900/15 hover:bg-purple-800 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-400',
  secondaryButton: 'border border-purple-200 text-purple-700 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-800/60 dark:text-violet-200 dark:hover:bg-purple-950/30',
  softButton: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950/40 dark:text-violet-200 dark:hover:bg-purple-900/50',
  focusRing: 'focus:ring-2 focus:ring-purple-500/30',
  heroGradient: 'bg-gradient-to-br from-[#2b174f] via-purple-700 to-violet-500',
  shadow: 'shadow-purple-900/10',
};

export const studyIdentity: ContentIdentity = {
  kind: 'study',
  label: 'Estudo',
  accent: 'text-cyan-700 dark:text-cyan-300',
  surface: 'bg-cyan-50 dark:bg-cyan-950/20',
  border: 'border-cyan-200 dark:border-cyan-900/50',
  hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500',
  primaryButton: 'bg-cyan-700 text-white shadow-lg shadow-cyan-900/15 hover:bg-cyan-800 dark:bg-cyan-500 dark:text-white dark:hover:bg-cyan-400',
  secondaryButton: 'border border-cyan-200 text-cyan-700 hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-900/60 dark:text-cyan-200 dark:hover:bg-cyan-950/30',
  softButton: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:hover:bg-cyan-900/50',
  focusRing: 'focus:ring-2 focus:ring-cyan-500/30',
  heroGradient: 'bg-gradient-to-br from-cyan-950 via-cyan-800 to-sky-600',
  shadow: 'shadow-cyan-900/10',
};

export const defaultIdentity: ContentIdentity = {
  kind: 'default',
  label: 'Conteudo',
  accent: 'text-gray-600 dark:text-gray-300',
  surface: 'bg-gray-50 dark:bg-gray-900/50',
  border: 'border-gray-100 dark:border-gray-800',
  hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-700',
  primaryButton: 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black',
  secondaryButton: 'border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300',
  softButton: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200',
  focusRing: 'focus:ring-2 focus:ring-gray-400/30',
  heroGradient: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600',
  shadow: 'shadow-black/10',
};

const roomKinds = new Set(['room', 'plan', 'sala', 'jornada']);

export const getContentIdentity = (kind?: string | null): ContentIdentity => {
  const normalized = String(kind || '').toLowerCase();
  if (roomKinds.has(normalized)) return roomIdentity;
  if (normalized === 'study' || normalized === 'estudo') return studyIdentity;
  return defaultIdentity;
};
