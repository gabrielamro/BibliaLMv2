export type BibleVersionId = 'ara' | 'arc' | 'nvi' | 'acf' | 'almeida1917';

export interface BibleVersionOption {
  id: BibleVersionId;
  label: string;
  desc: string;
}

export const DEFAULT_BIBLE_VERSION: BibleVersionId = 'ara';

export const BIBLE_VERSIONS: BibleVersionOption[] = [
  { id: 'ara', label: 'ARA', desc: 'Rev. e Atualizada' },
  { id: 'arc', label: 'ARC', desc: 'Rev. e Corrigida' },
  { id: 'nvi', label: 'NVI', desc: 'Nova Versão Int.' },
  { id: 'acf', label: 'ACF', desc: 'Corrigida Fiel' },
  { id: 'almeida1917', label: '1917', desc: 'Almeida Clássica' },
];

export function findBibleVersion(versionId?: string | null): BibleVersionOption | undefined {
  return BIBLE_VERSIONS.find(version => version.id === versionId);
}

export function normalizeBibleVersion(versionId?: string | null): BibleVersionId {
  return findBibleVersion(versionId)?.id ?? DEFAULT_BIBLE_VERSION;
}

export function shouldAskToSaveBibleVersion(activeVersion?: string, defaultVersion?: string): boolean {
  if (!activeVersion) return false;
  return normalizeBibleVersion(activeVersion) !== normalizeBibleVersion(defaultVersion);
}
