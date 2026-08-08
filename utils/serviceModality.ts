import type { ChurchService, ChurchServiceModality } from '../types';

/**
 * Fonte única de verdade para decidir se um culto é presencial, online ou híbrido.
 *
 * `serviceType` (`sunday`, `youth`, `vigil`, ...) descreve a categoria litúrgica do culto e
 * nunca a modalidade de participação, por isso a modalidade vive em um campo próprio
 * (`ChurchService.modality` / `church_services.modality`). Registros antigos não possuem o
 * campo; nesses casos a presença de `liveUrl` é o único sinal disponível e o padrão seguro
 * é `presencial`.
 */

export type ServiceModalityFilter = 'all' | ChurchServiceModality;

type ServiceModalitySource = {
  modality?: ChurchService['modality'] | string | null;
  liveUrl?: string | null;
  churchName?: string | null;
};

export const DEFAULT_SERVICE_MODALITY: ChurchServiceModality = 'presencial';

export const SERVICE_MODALITY_VALUES: ChurchServiceModality[] = ['presencial', 'online', 'hibrido'];

const MODALITY_ALIASES: Record<string, ChurchServiceModality> = {
  presencial: 'presencial',
  presential: 'presencial',
  in_person: 'presencial',
  'in-person': 'presencial',
  local: 'presencial',
  online: 'online',
  stream: 'online',
  streaming: 'online',
  remote: 'online',
  remoto: 'online',
  hibrido: 'hibrido',
  'híbrido': 'hibrido',
  hybrid: 'hibrido',
};

export const SERVICE_MODALITY_META: Record<
  ChurchServiceModality,
  { label: string; badgeLabel: string; description: string; participationLabel: string }
> = {
  presencial: {
    label: 'Presencial',
    badgeLabel: 'Presencial',
    description: 'Participe no endereço da igreja.',
    participationLabel: 'Local',
  },
  online: {
    label: 'Online',
    badgeLabel: 'Online',
    description: 'Acompanhe pela transmissão do culto.',
    participationLabel: 'Transmissão',
  },
  hibrido: {
    label: 'Híbrido',
    badgeLabel: 'Presencial e online',
    description: 'Participe no local ou acompanhe pela transmissão.',
    participationLabel: 'Local e transmissão',
  },
};

export const SERVICE_MODALITY_FILTERS: Array<{ value: ServiceModalityFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'presencial', label: 'Presenciais' },
  { value: 'online', label: 'Online' },
];

export const normalizeServiceModality = (value: unknown): ChurchServiceModality | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return MODALITY_ALIASES[normalized] ?? null;
};

export const hasServiceStream = (liveUrl?: string | null): boolean =>
  typeof liveUrl === 'string' && liveUrl.trim().length > 0;

export const getServiceModality = (service?: ServiceModalitySource | null): ChurchServiceModality => {
  if (!service) return DEFAULT_SERVICE_MODALITY;

  const declared = normalizeServiceModality(service.modality);
  if (declared) return declared;

  return hasServiceStream(service.liveUrl) ? 'online' : DEFAULT_SERVICE_MODALITY;
};

export const getServiceModalityLabel = (service?: ServiceModalitySource | null): string =>
  SERVICE_MODALITY_META[getServiceModality(service)].label;

/** Híbrido participa dos dois filtros porque acontece no local e na transmissão. */
export const serviceMatchesModalityFilter = (
  service: ServiceModalitySource,
  filter: ServiceModalityFilter,
): boolean => {
  if (filter === 'all') return true;
  const modality = getServiceModality(service);
  if (modality === 'hibrido') return true;
  return modality === filter;
};

export const filterServicesByModality = <T extends ServiceModalitySource>(
  services: T[],
  filter: ServiceModalityFilter,
): T[] => (filter === 'all' ? services : services.filter((service) => serviceMatchesModalityFilter(service, filter)));

export const countServicesByModalityFilter = (
  services: ServiceModalitySource[],
  filter: ServiceModalityFilter,
): number => filterServicesByModality(services, filter).length;

/** Texto de onde participar: endereço/igreja para presencial, transmissão para online. */
export const getServiceParticipationLabel = (
  service?: ServiceModalitySource | null,
  options?: { locationLabel?: string | null },
): string => {
  const modality = getServiceModality(service);
  const place = (options?.locationLabel || service?.churchName || '').trim() || 'Endereço da igreja';

  if (modality === 'online') return 'Transmissão online';
  if (modality === 'hibrido') return `${place} e transmissão online`;
  return place;
};
