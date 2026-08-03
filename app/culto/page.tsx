"use client";

import Link from 'next/link';
import { ArrowLeft, Radio, Search, Sparkles } from 'lucide-react';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function Page() {
  return (
    <CultoPlusPageShell><main className="min-h-full bg-[var(--module-soft)] text-gray-950 dark:bg-black dark:text-white">
      <section className="relative overflow-hidden bg-[#073b35] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#073b35] via-[#0f5d51] to-[#d8b15f]" />
        <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col justify-between px-5 py-8 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/social/igrejas" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/12 px-4 text-xs font-black uppercase tracking-widest ring-1 ring-white/20 transition hover:bg-white/20">
              <ArrowLeft size={15} />
              Igrejas
            </Link>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/12 px-4 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50 ring-1 ring-white/20">
              <Sparkles size={13} className="text-[#f3d28a]" />
              Culto+
            </span>
          </div>

          <div className="max-w-3xl pb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#f3d28a]">OnePage do Culto</p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">Acompanhe um culto publicado</h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/85 md:text-lg">
              Abra o link compartilhado pela sua igreja para acessar check-in, liturgia, versiculo-chave, pedidos de oracao e feed do culto.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/social/igrejas" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3d28a] px-5 text-[10px] font-black uppercase tracking-widest text-[#073b35] shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-white">
                <Search size={16} />
                Encontrar igreja
              </Link>
              <Link href="/workspace-pastoral/cultos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white/12 px-5 text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20 transition hover:bg-white/20">
                <Radio size={16} />
                Gerenciar Culto+
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main></CultoPlusPageShell>
  );
}
