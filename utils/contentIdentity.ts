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
  accent: 'text-bible-gold',
  surface: 'bg-bible-gold/10',
  border: 'border-bible-gold/30',
  hoverBorder: 'hover:border-bible-gold',
  primaryButton: 'bg-bible-leather text-white hover:opacity-90 dark:bg-bible-gold dark:text-black',
  secondaryButton: 'border border-gray-200 text-gray-600 hover:border-bible-gold hover:text-bible-gold dark:border-gray-700 dark:text-gray-300',
  softButton: 'bg-bible-gold/10 text-bible-gold hover:bg-bible-gold hover:text-white',
  focusRing: 'focus:ring-2 focus:ring-bible-gold/30',
  heroGradient: 'bg-gradient-to-br from-[#1f1710] via-[#2c2117] to-black',
  shadow: 'shadow-bible-gold/10',
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
