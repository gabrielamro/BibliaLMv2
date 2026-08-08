"use client";

import React from 'react';
import type { ChurchServiceModality } from '../../types';
import {
  SERVICE_MODALITY_FILTERS,
  countServicesByModalityFilter,
  type ServiceModalityFilter as ServiceModalityFilterValue,
} from '../../utils/serviceModality';

type ServiceModalitySource = {
  modality?: ChurchServiceModality;
  liveUrl?: string | null;
};

type ServiceModalityFilterProps = {
  services: ServiceModalitySource[];
  value: ServiceModalityFilterValue;
  onChange: (value: ServiceModalityFilterValue) => void;
  label?: string;
  className?: string;
};

/** Filtros explícitos Todos/Presenciais/Online para a agenda pública de cultos. */
const ServiceModalityFilter: React.FC<ServiceModalityFilterProps> = ({
  services,
  value,
  onChange,
  label = 'Filtrar cultos por modalidade',
  className = '',
}) => (
  <div className={`flex flex-wrap items-center gap-1.5 ${className}`} role="group" aria-label={label}>
    {SERVICE_MODALITY_FILTERS.map((filter) => {
      const isActive = filter.value === value;
      const total = countServicesByModalityFilter(services, filter.value);

      return (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          aria-pressed={isActive}
          className={`module-focus module-border inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition ${
            isActive
              ? 'module-accent-bg'
              : 'bg-white text-gray-500 hover:text-gray-900 dark:bg-bible-darkPaper dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          {filter.label}
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? 'bg-black/15' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {total}
          </span>
        </button>
      );
    })}
  </div>
);

export default ServiceModalityFilter;
