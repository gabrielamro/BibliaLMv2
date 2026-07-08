"use client";

import { Crown } from 'lucide-react';
import type { SubscriptionTier } from '../types';

const PAID_TIER_LABELS: Partial<Record<SubscriptionTier, string>> = {
  bronze: 'Semeador',
  silver: 'Fiel',
  gold: 'Visionario',
  pastor: 'Pastor',
};

const PAID_TIER_STYLES: Partial<Record<SubscriptionTier, string>> = {
  bronze: 'from-amber-700 via-amber-500 to-yellow-300 text-white ring-amber-300/40',
  silver: 'from-slate-600 via-slate-400 to-white text-slate-950 ring-slate-300/60',
  gold: 'from-[#073b35] via-[#0f5d51] to-[#d8b15f] text-white ring-[#d8b15f]/50',
  pastor: 'from-[#073b35] via-emerald-700 to-[#c5a059] text-white ring-[#c5a059]/50',
};

type PaidAccountBadgeProps = {
  tier?: SubscriptionTier | null;
  compact?: boolean;
  className?: string;
};

export const isPaidAccountTier = (tier?: SubscriptionTier | null) =>
  tier === 'bronze' || tier === 'silver' || tier === 'gold' || tier === 'pastor';

export default function PaidAccountBadge({ tier, compact = false, className = '' }: PaidAccountBadgeProps) {
  if (!isPaidAccountTier(tier)) return null;

  const label = PAID_TIER_LABELS[tier] ?? 'Premium';
  const style = PAID_TIER_STYLES[tier] ?? PAID_TIER_STYLES.gold;

  return (
    <span
      title={`Conta paga: ${label}`}
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r ${style} px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] shadow-sm ring-1 ${className}`}
    >
      <Crown size={compact ? 10 : 12} fill="currentColor" aria-hidden="true" />
      {compact ? label : `Plano ${label}`}
    </span>
  );
}
