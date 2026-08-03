"use client";

import Link from 'next/link';
import {
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Church,
  ClipboardCheck,
  HandHeart,
  Loader2,
} from 'lucide-react';
import type { KingdomPathData } from '../../services/kingdomPathService';

type KingdomPathRailProps = {
  data: KingdomPathData;
  isLoading: boolean;
  churchHref: string;
  hasChurch: boolean;
  savedPostsCount: number;
  onShowSaved: () => void;
  variant?: 'desktop' | 'mobile';
};

const formatJourneyDate = (value?: string | null) => {
  if (!value) return 'Data a confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace('.', '');
};

const serviceStatus = (status?: string) => {
  if (status === 'live' || status === 'in_progress') return 'Ao vivo';
  if (status === 'checkin_open') return 'Check-in aberto';
  return 'Confirmado';
};

const initials = (name?: string) => (name || 'Irmão').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

const PathContent = ({ data, churchHref, hasChurch, savedPostsCount, onShowSaved }: Omit<KingdomPathRailProps, 'isLoading' | 'variant'>) => {
  const service = data.nextService;
  const prayer = data.prayerInvitation;
  const study = data.savedStudy;
  const scale = data.scaleInvitation;
  const scalePending = scale?.assignment.status === 'pending';

  return (
    <div className="space-y-4">
      <section aria-labelledby="kingdom-next-service-title">
        <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <CalendarDays size={17} aria-hidden="true" />
          <h3 id="kingdom-next-service-title" className="text-xs font-black uppercase tracking-[0.12em]">Próximo culto</h3>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/55 p-3 dark:border-emerald-400/15 dark:bg-emerald-500/[0.06]">
          {service ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-sm text-gray-950 dark:text-white">{service.title}</strong>
                  <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{formatJourneyDate(service.startsAt)}</span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{service.churchName}</span>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">{serviceStatus(service.status)}</span>
              </div>
              <Link href={`/culto/${service.slug}`} className="module-focus mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-emerald-900 shadow-sm transition hover:bg-emerald-100 dark:bg-white/10 dark:text-emerald-100 dark:hover:bg-white/15">Ver detalhes do culto <ChevronRight size={15} /></Link>
            </>
          ) : (
            <Link href="/culto" className="module-focus flex min-h-11 items-center justify-between gap-3 text-sm font-bold text-gray-700 dark:text-gray-200"><span>Consulte a agenda da comunidade</span><ChevronRight size={16} /></Link>
          )}
        </div>
      </section>

      {scale ? (
        <section aria-labelledby="kingdom-scale-title">
          <div className="mb-2 flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <ClipboardCheck size={17} aria-hidden="true" />
            <h3 id="kingdom-scale-title" className="text-xs font-black uppercase tracking-[0.12em]">{scalePending ? 'Convite para escala' : 'Próxima escala'}</h3>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/55 p-3 dark:border-orange-400/15 dark:bg-orange-500/[0.06]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 shadow-sm dark:bg-white/10 dark:text-orange-200"><ClipboardCheck size={19} /></span>
              <div className="min-w-0"><strong className="block truncate text-sm text-gray-950 dark:text-white">{scale.assignment.title}</strong><span className="mt-1 block truncate text-xs text-gray-500 dark:text-gray-400">{scale.team?.name || scale.service?.title || 'Equipe da igreja'}</span><span className="block text-xs text-gray-500 dark:text-gray-400">{formatJourneyDate(scale.assignment.startsAt || scale.service?.startsAt)}</span></div>
            </div>
            <Link href="/meus-cultos#escala" className="module-focus mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-orange-900 shadow-sm transition hover:bg-orange-100 dark:bg-white/10 dark:text-orange-100 dark:hover:bg-white/15">{scalePending ? 'Responder convite' : 'Ver minha escala'} <ChevronRight size={15} /></Link>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="kingdom-prayer-title">
        <div className="mb-2 flex items-center gap-2 text-violet-700 dark:text-violet-300">
          <HandHeart size={17} aria-hidden="true" />
          <h3 id="kingdom-prayer-title" className="text-xs font-black uppercase tracking-[0.12em]">Convite de oração</h3>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50/55 p-3 dark:border-violet-400/15 dark:bg-violet-500/[0.06]">
          {prayer ? <div className="flex items-start gap-3">{prayer.userPhotoURL ? <img src={prayer.userPhotoURL} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-800 dark:bg-violet-400/15 dark:text-violet-200">{initials(prayer.userName)}</span>}<div className="min-w-0"><strong className="block truncate text-sm text-gray-950 dark:text-white">{prayer.userName}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{prayer.content}</p></div></div> : <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">Reserve um momento para interceder pela sua comunidade.</p>}
          <Link href="/social/oracao" className="module-focus mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-violet-900 shadow-sm transition hover:bg-violet-100 dark:bg-white/10 dark:text-violet-100 dark:hover:bg-white/15">Orar agora <ChevronRight size={15} /></Link>
        </div>
      </section>

      <section aria-labelledby="kingdom-saved-study-title">
        <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <Bookmark size={17} aria-hidden="true" />
          <h3 id="kingdom-saved-study-title" className="text-xs font-black uppercase tracking-[0.12em]">Estudo guardado</h3>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/55 p-3 dark:border-amber-400/15 dark:bg-amber-500/[0.06]">
          {study ? <div className="flex items-start gap-3">{study.coverUrl ? <img src={study.coverUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"><BookOpen size={22} /></span>}<div className="min-w-0"><strong className="block line-clamp-2 text-sm text-gray-950 dark:text-white">{study.title}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{study.description || 'Continue sua leitura e preserve o que Deus está ensinando.'}</p></div></div> : <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">Sua próxima leitura pode começar na biblioteca do Reino.</p>}
          <Link href={study ? `/v/${study.id}` : '/estudos'} className="module-focus mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-amber-900 shadow-sm transition hover:bg-amber-100 dark:bg-white/10 dark:text-amber-100 dark:hover:bg-white/15">{study ? 'Continuar estudo' : 'Explorar estudos'} <ChevronRight size={15} /></Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 border-t border-[#eee8e0] pt-4 dark:border-white/10">
        <button type="button" onClick={onShowSaved} className="module-focus flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-fuchsia-800 transition hover:bg-fuchsia-50 dark:text-fuchsia-200 dark:hover:bg-white/5"><Bookmark size={15} /> Salvos{savedPostsCount ? ` (${savedPostsCount})` : ''}</button>
        <Link href={churchHref} className="module-focus flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-violet-800 transition hover:bg-violet-50 dark:text-violet-200 dark:hover:bg-white/5"><Church size={15} /> {hasChurch ? 'Minha igreja' : 'Igrejas'}</Link>
      </div>
      {data.hasPartialFailure ? <p className="text-center text-[10px] leading-4 text-gray-400">Alguns detalhes serão atualizados quando a conexão estabilizar.</p> : null}
    </div>
  );
};

export default function KingdomPathRail(props: KingdomPathRailProps) {
  if (props.variant === 'mobile') {
    return (
      <details data-testid="kingdom-path-mobile" className="mb-5 rounded-2xl border border-[#e4ded5] bg-white shadow-sm dark:border-white/10 dark:bg-[#17131d] xl:hidden">
        <summary className="module-focus flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 text-sm font-black text-gray-950 dark:text-white">
          <span className="h-1 w-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" />
          <span className="flex-1">Seu caminho</span>
          {props.data.scaleInvitation?.assignment.status === 'pending' ? <span className="rounded-full bg-orange-100 px-2 py-1 text-[9px] font-black text-orange-800">Escala pendente</span> : null}
          <ChevronDown size={17} />
        </summary>
        <div className="border-t border-[#eee8e0] p-4 dark:border-white/10">{props.isLoading ? <div className="flex min-h-24 items-center justify-center gap-3 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Atualizando seu caminho</div> : <PathContent {...props} />}</div>
      </details>
    );
  }

  return (
    <aside data-testid="kingdom-path-rail" aria-labelledby="kingdom-path-title" className="sticky top-5 hidden max-h-[calc(100vh-2.5rem)] self-start overflow-y-auto rounded-[1.5rem] border border-[#e4ded5] bg-white p-5 shadow-[0_14px_45px_rgba(30,20,45,0.07)] no-scrollbar dark:border-white/10 dark:bg-[#17131d] xl:block">
      <div className="mb-4 flex items-center gap-3 border-b border-[#eee8e0] pb-4 dark:border-white/10">
        <span className="h-1 w-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" />
        <h2 id="kingdom-path-title" className="text-lg font-black text-gray-950 dark:text-white">Seu caminho</h2>
      </div>
      {props.isLoading ? <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-gray-500"><Loader2 size={20} className="animate-spin" /> Atualizando seu caminho</div> : <PathContent {...props} />}
    </aside>
  );
}
