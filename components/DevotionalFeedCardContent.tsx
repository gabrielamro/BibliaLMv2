"use client";

import Link from 'next/link';
import { ArrowUpRight, BookOpen, Quote, Wheat } from 'lucide-react';

interface DevotionalFeedCardContentProps {
  title: string;
  verseText: string;
  verseReference: string;
  message?: string;
  href?: string;
  interactive?: boolean;
}

export default function DevotionalFeedCardContent({
  title,
  verseText,
  verseReference,
  message = '',
  href = '/devocional',
  interactive = true,
}: DevotionalFeedCardContentProps) {
  const content = (
    <div
      data-testid="devotional-feed-card"
      className="group/devotional overflow-hidden rounded-[1.6rem] border border-emerald-900/10 bg-[#fffdf8] shadow-[0_18px_50px_rgba(8,35,47,0.09)] dark:border-emerald-300/10 dark:bg-[#101515]"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-[#07162e] via-[#0a3842] to-[#075e52] px-5 py-5 text-white sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-emerald-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-20 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-100 backdrop-blur">
              <Wheat size={12} aria-hidden="true" /> Pão Diário · Culto+
            </span>
            <h3 className="mt-4 text-xl font-black leading-tight text-white sm:text-2xl">{title}</h3>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-100">
            <BookOpen size={21} aria-hidden="true" />
          </span>
        </div>

        <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 backdrop-blur-sm">
          <Quote className="absolute right-4 top-3 text-white/10" size={34} aria-hidden="true" />
          <p className="relative pr-6 font-serif text-[15px] leading-relaxed text-white/95 sm:text-base">
            “{verseText}”
          </p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
            {verseReference}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {message.trim() ? (
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#334155] dark:text-gray-200">
            {message.trim()}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Uma Palavra para ler, refletir, orar e colocar em prática.
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#ece6dd] pt-4 dark:border-white/10">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">Jornada diária</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
            Abrir Pão Diário <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );

  if (!interactive) return content;

  return (
    <Link href={href} className="block rounded-[1.6rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
      {content}
    </Link>
  );
}
