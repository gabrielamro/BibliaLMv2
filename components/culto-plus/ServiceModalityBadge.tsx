"use client";

import React from 'react';
import { Globe, MapPin, Radio } from 'lucide-react';
import type { ChurchServiceModality } from '../../types';
import { SERVICE_MODALITY_META, getServiceModality, getServiceParticipationLabel } from '../../utils/serviceModality';

type ServiceModalitySource = {
  modality?: ChurchServiceModality;
  liveUrl?: string | null;
  churchName?: string | null;
};

const MODALITY_ICONS: Record<ChurchServiceModality, React.ComponentType<{ size?: number | string; className?: string }>> = {
  presencial: MapPin,
  online: Radio,
  hibrido: Globe,
};

type ServiceModalityBadgeProps = {
  service: ServiceModalitySource;
  size?: 'xs' | 'sm';
  className?: string;
};

/**
 * Selo de modalidade sempre com texto + ícone: cor nunca é o único sinal.
 * As superfícies ficam neutras e a identidade vem dos tokens do módulo.
 */
export const ServiceModalityBadge: React.FC<ServiceModalityBadgeProps> = ({ service, size = 'sm', className = '' }) => {
  const modality = getServiceModality(service);
  const meta = SERVICE_MODALITY_META[modality];
  const Icon = MODALITY_ICONS[modality];
  const iconSize = size === 'xs' ? 9 : 12;
  const text = size === 'xs' ? meta.label : meta.badgeLabel;

  return (
    <span
      data-modality={modality}
      className={`module-border inline-flex max-w-full items-center gap-1 rounded-full border bg-white/90 px-2 py-0.5 font-black uppercase tracking-widest text-gray-700 dark:bg-black/40 dark:text-gray-100 ${size === 'xs' ? 'text-[8px]' : 'text-[9px]'} ${className}`}
    >
      <Icon size={iconSize} className="module-accent-text shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
};

type ServiceParticipationHintProps = {
  service: ServiceModalitySource;
  locationLabel?: string | null;
  className?: string;
};

/** Linha de apoio informando local (presencial) ou transmissão (online). */
export const ServiceParticipationHint: React.FC<ServiceParticipationHintProps> = ({
  service,
  locationLabel,
  className = '',
}) => {
  const modality = getServiceModality(service);
  const meta = SERVICE_MODALITY_META[modality];
  const Icon = MODALITY_ICONS[modality];

  return (
    <span className={`inline-flex min-w-0 items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 ${className}`}>
      <Icon size={11} className="shrink-0" />
      <span className="truncate">
        {meta.participationLabel}: {getServiceParticipationLabel(service, { locationLabel })}
      </span>
    </span>
  );
};

export default ServiceModalityBadge;
