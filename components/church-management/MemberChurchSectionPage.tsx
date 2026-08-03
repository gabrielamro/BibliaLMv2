"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  HeartHandshake,
  Inbox,
  Medal,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  memberActionsPreview,
  memberBadgesPreview,
  memberUpdatesPreview,
} from "../../services/churchManagementPreviewService";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchFormSubmission, ChurchVolunteerBadge } from "../../types";

type MemberSectionKind = "acompanhamento" | "designacoes" | "equipes" | "insignias";

interface MemberSectionConfig {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
}

const configs: Record<MemberSectionKind, MemberSectionConfig> = {
  acompanhamento: {
    title: "Meu acompanhamento",
    eyebrow: "Retornos da igreja",
    description: "Status visivel de pedidos, voluntariado, respostas e proximas acoes sem expor bastidores pastorais.",
    icon: ShieldCheck,
  },
  designacoes: {
    title: "Minhas designacoes",
    eyebrow: "Atividades de servico",
    description: "Convites, aceite, disponibilidade e historico de servico por atividade personalizada da igreja.",
    icon: ClipboardList,
  },
  equipes: {
    title: "Minhas equipes",
    eyebrow: "Lideres e voluntarios",
    description: "Grupos onde o membro serve, lider responsavel, agenda e avisos importantes.",
    icon: Users,
  },
  insignias: {
    title: "Minhas conquistas",
    eyebrow: "Selos padrao",
    description: "Conquistas e Mana de servico como memoria de disponibilidade, sem ranking espiritual.",
    icon: Medal,
  },
};

export default function MemberChurchSectionPage({ section }: { section: MemberSectionKind }) {
  const { currentUser, userProfile } = useAuth();
  const config = configs[section];
  const Icon = config.icon;
  const isBadges = section === "insignias";
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid;
  const [submissions, setSubmissions] = useState<ChurchFormSubmission[]>([]);
  const [badges, setBadges] = useState<ChurchVolunteerBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!currentUserId || (section !== "acompanhamento" && !activeChurchId)) return;
    let isMounted = true;
    const churchId = activeChurchId ?? "";
    setIsLoading(true);
    const request = section === "acompanhamento"
      ? churchManagementService.listMemberSubmissions(currentUserId, { limit: 50 }).then((items) => {
          if (isMounted) setSubmissions(items);
        })
      : section === "insignias"
      ? churchManagementService.listBadges(churchId, { userId: currentUserId, limit: 25 }).then((items) => {
          if (isMounted) setBadges(items);
        })
      : churchManagementService.listSubmissions(churchId, { submitterUserId: currentUserId, limit: 25 }).then((items) => {
          if (isMounted) setSubmissions(items);
        });
    request
      .catch(() => {
        if (!isMounted) return;
        setSubmissions([]);
        setBadges([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId, currentUserId, reloadKey, section]);

  const displayItems = useMemo(() => {
    if (isBadges && badges.length > 0) {
      return badges.map((badge) => ({
        key: badge.id,
        title: badge.title,
        detail: badge.description || "Conquista padrao do Culto+ registrada por evento auditavel.",
        status: `${badge.manaAmount} Mana`,
        icon: Medal,
      }));
    }

    if (!isBadges && submissions.length > 0) {
      return submissions.map((submission) => ({
        key: submission.id,
        title: getSubmissionTitle(submission.formType),
        detail: submission.publicFeedback || submission.publicStatus || "Recebido pela igreja.",
        status: getPublicStatus(submission.status, submission.publicStatus),
        icon: ShieldCheck,
      }));
    }

    return (isBadges ? memberBadgesPreview : memberUpdatesPreview).map((item) => {
      const title = "title" in item ? item.title : item.label;
      const detail = "detail" in item ? item.detail : item.text;
      const status = "status" in item ? item.status : item.mana;
      return { key: title, title, detail, status, icon: item.icon ?? Award };
    });
  }, [badges, isBadges, submissions]);

  if (section === "acompanhamento") {
    return (
      <MemberTrackingPage
        submissions={submissions}
        isLoading={isLoading}
        onRefresh={() => setReloadKey((value) => value + 1)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/minha-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <Icon size={15} className="text-[#d8b15f]" />
                {config.eyebrow}
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">{config.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{config.description}</p>
            </div>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-slate-100">
              Atualizar retorno
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_0.8fr]">
        {isLoading ? (
          <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Carregando seus retornos da igreja...
          </div>
        ) : null}
        <div className="grid gap-4">
          {displayItems.map((item) => {
            const ItemIcon = item.icon ?? Award;
            return (
              <article key={item.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <ItemIcon size={21} />
                    </span>
                    <div>
                      <h2 className="text-lg font-black">{item.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.detail}</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {item.status}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays size={22} className="text-slate-700 dark:text-slate-200" />
              <h2 className="text-xl font-black">Proximas acoes</h2>
            </div>
            <div className="space-y-3">
              {memberActionsPreview.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button key={action.label} className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-slate-200 px-3 text-left text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10">
                    <ActionIcon size={18} className="text-slate-500 dark:text-slate-300" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <Bell size={22} className="text-[#9a7a2f]" />
              <h2 className="text-xl font-black">Feedback ao usuario</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Toda alteracao relevante deve gerar notificacao ou alerta.</p>
              <p className="flex gap-3"><ShieldCheck size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />O membro ve status e proximas acoes, nao notas internas sensiveis.</p>
              <p className="flex gap-3"><Medal size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Insignias sao conquistas padrao do Culto+ e nao medem maturidade espiritual.</p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

type TrackingFilter = "Todos" | "Em andamento" | "Aguardando você" | "Concluídos";

function MemberTrackingPage({ submissions, isLoading, onRefresh }: { submissions: ChurchFormSubmission[]; isLoading: boolean; onRefresh: () => void }) {
  const [filter, setFilter] = useState<TrackingFilter>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const selected = submissions.find((item) => item.id === selectedId) ?? null;
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");

  const filtered = useMemo(() => submissions.filter((item) => {
    const title = getSubmissionTitle(item.formType);
    const matchesSearch = !normalizedSearch || [title, item.publicStatus, item.publicFeedback, item.nextAction]
      .some((value) => (value || "").toLocaleLowerCase("pt-BR").includes(normalizedSearch));
    const matchesFilter = filter === "Todos"
      || (filter === "Em andamento" && !["waiting_member", "answered", "closed", "archived"].includes(item.status))
      || (filter === "Aguardando você" && item.status === "waiting_member")
      || (filter === "Concluídos" && ["answered", "closed", "archived"].includes(item.status));
    return matchesSearch && matchesFilter;
  }), [filter, normalizedSearch, submissions]);

  useEffect(() => {
    if (!selected) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId("");
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled"));
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [selected]);

  const summary = [
    { label: "Pedidos enviados", value: submissions.length, icon: Send, tone: "text-blue-300" },
    { label: "Em andamento", value: submissions.filter((item) => !["waiting_member", "answered", "closed", "archived"].includes(item.status)).length, icon: Clock3, tone: "text-amber-300" },
    { label: "Aguardando você", value: submissions.filter((item) => item.status === "waiting_member").length, icon: CircleDot, tone: "text-rose-300" },
    { label: "Concluídos", value: submissions.filter((item) => ["answered", "closed", "archived"].includes(item.status)).length, icon: CheckCircle2, tone: "text-emerald-300" },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950 dark:bg-[#070a0d] dark:text-white">
      <section className="bg-gradient-to-r from-[#071326] via-[#0d2a31] to-[#07533f] text-white">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/minha-igreja" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-bold transition hover:bg-white/10"><ArrowLeft size={15} /> Voltar</Link>
            <button type="button" onClick={onRefresh} disabled={isLoading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold transition hover:bg-white/20 disabled:opacity-60"><RefreshCcw size={15} className={isLoading ? "animate-spin" : ""} /> Atualizar</button>
          </div>
          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200"><HeartHandshake size={15} /> Minha Igreja</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Acompanhamento</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">Veja em que etapa estão seus pedidos e quais são os próximos passos informados pela igreja responsável.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[650px]">
              {summary.map(({ label, value, icon: MetricIcon, tone }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm"><div className="flex items-center justify-between"><MetricIcon size={16} className={tone} /><strong className="text-xl">{value}</strong></div><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-5 sm:px-6 lg:px-8">
        {submissions.some((item) => item.status === "waiting_member") ? (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-300/20 dark:bg-amber-300/10">
            <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-200"><Bell size={18} /></span><div><p className="text-sm font-black text-amber-950 dark:text-amber-100">A igreja aguarda uma ação sua</p><p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">Abra o pedido sinalizado para conferir a orientação recebida.</p></div></div>
            <button type="button" onClick={() => setFilter("Aguardando você")} className="min-h-10 rounded-xl bg-amber-950 px-4 text-xs font-black uppercase text-white dark:bg-amber-200 dark:text-amber-950">Ver pendências</button>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_240px]">
            <label className="relative"><span className="sr-only">Buscar pedido</span><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por assunto, status ou orientação..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-white/10 dark:bg-[#11161d] dark:focus:ring-emerald-500/20" /></label>
            <label><span className="sr-only">Filtrar acompanhamento</span><select value={filter} onChange={(event) => setFilter(event.target.value as TrackingFilter)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-[#11161d]">{["Todos", "Em andamento", "Aguardando você", "Concluídos"].map((option) => <option key={option}>{option}</option>)}</select></label>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between"><div><h2 className="text-lg font-black">Meus pedidos</h2><p className="text-xs text-slate-500">{filtered.length} de {submissions.length} acompanhamentos</p></div>{isLoading ? <span className="text-xs font-bold text-emerald-700">Buscando atualizações...</span> : null}</div>

        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {filtered.map((item) => {
            const meta = getTrackingMeta(item.status, item.publicStatus);
            const ItemIcon = getTrackingIcon(item.formType);
            return (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}><ItemIcon size={20} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{getFormTypeLabel(item.formType)}</p><h3 className="mt-1 text-base font-black">{getSubmissionTitle(item.formType)}</h3></div><span className={`rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase ${meta.badgeClass}`}>{meta.label}</span></div></div></div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.publicFeedback || "Seu pedido foi registrado e será acompanhado pela igreja."}</p>
                <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/5"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Próxima etapa</p><p className="mt-1 text-xs font-bold leading-5 text-slate-800 dark:text-slate-100">{item.nextAction || getDefaultNextAction(item.status)}</p></div>
                <ProgressSteps status={item.status} compact />
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-400 dark:border-white/10"><span>Atualizado em {formatTrackingDate(item.updatedAt)}</span><span className="flex items-center gap-1 font-black text-emerald-700 dark:text-emerald-300">Ver detalhes <ChevronRight size={14} /></span></div>
              </button>
            );
          })}
        </div>

        {!isLoading && submissions.length === 0 ? <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]"><Inbox size={34} className="mx-auto text-slate-300" /><h2 className="mt-4 text-lg font-black">Você ainda não possui pedidos</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Quando você enviar um formulário ou se candidatar a uma equipe, o acompanhamento aparecerá aqui.</p><Link href="/minha-igreja" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#082f2b] px-5 text-xs font-black uppercase text-white">Voltar para Minha Igreja</Link></div> : null}
        {!isLoading && submissions.length > 0 && filtered.length === 0 ? <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center dark:border-white/10 dark:bg-white/[0.04]"><Search size={30} className="mx-auto text-slate-300" /><h2 className="mt-3 font-black">Nenhum pedido encontrado</h2><button type="button" onClick={() => { setFilter("Todos"); setSearchTerm(""); }} className="mt-4 min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase dark:border-white/10">Limpar filtros</button></div> : null}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(""); }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="tracking-detail-title" className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-[#f7f8fa] shadow-2xl sm:max-h-[90vh] sm:rounded-3xl dark:bg-[#0d1117]">
            <header className="bg-gradient-to-r from-[#071326] to-[#07533f] px-5 py-4 text-white sm:px-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Acompanhamento do pedido</p><h2 id="tracking-detail-title" className="mt-1 text-xl font-black sm:text-2xl">{getSubmissionTitle(selected.formType)}</h2><p className="mt-1 text-xs text-slate-300">Enviado em {formatTrackingDate(selected.createdAt)}</p></div><button ref={closeButtonRef} type="button" onClick={() => setSelectedId("")} aria-label="Fechar acompanhamento" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={20} /></button></div></header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase ${getTrackingMeta(selected.status, selected.publicStatus).badgeClass}`}>{getTrackingMeta(selected.status, selected.publicStatus).label}</span><span className="text-xs font-semibold text-slate-500">Atualizado em {formatTrackingDate(selected.updatedAt)}</span></div>
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><h3 className="font-black">Etapas do pedido</h3><p className="mt-1 text-xs text-slate-500">Acompanhe o avanço desde o envio até a conclusão.</p><ProgressSteps status={selected.status} /></section>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Retorno da igreja</p><p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{selected.publicFeedback || "Seu pedido foi recebido e está sendo acompanhado com cuidado."}</p></section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Próxima ação</p><p className="mt-3 text-sm font-bold leading-7 text-slate-800 dark:text-slate-100">{selected.nextAction || getDefaultNextAction(selected.status)}</p></section>
              </div>
              <div className="mt-5 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900 dark:border-blue-300/15 dark:bg-blue-400/10 dark:text-blue-100"><ShieldCheck size={20} className="shrink-0" /><p className="text-xs leading-5">Esta área mostra somente informações destinadas a você. Notas pastorais e dados internos permanecem protegidos.</p></div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function ProgressSteps({ status, compact = false }: { status: string; compact?: boolean }) {
  const currentStep = getTrackingStep(status);
  const steps = ["Enviado", "Recebido", "Em acompanhamento", "Concluído"];
  return <div className={compact ? "mt-4" : "mt-6"}><div className="flex items-center">{steps.map((label, index) => <div key={label} className="flex flex-1 items-center last:flex-none"><span className={`flex shrink-0 items-center justify-center rounded-full font-black ${compact ? "h-5 w-5 text-[8px]" : "h-8 w-8 text-[10px]"} ${index <= currentStep ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10"}`}>{index < currentStep ? <CheckCircle2 size={compact ? 12 : 16} /> : index + 1}</span>{index < steps.length - 1 ? <span className={`h-1 flex-1 ${index < currentStep ? "bg-emerald-600" : "bg-slate-200 dark:bg-white/10"}`} /> : null}</div>)}</div>{!compact ? <div className="mt-2 grid grid-cols-4 text-center text-[9px] font-bold text-slate-500">{steps.map((label) => <span key={label}>{label}</span>)}</div> : null}</div>;
}

function getTrackingStep(status: string) {
  if (["answered", "closed", "archived"].includes(status)) return 3;
  if (["assigned", "in_progress", "waiting_member"].includes(status)) return 2;
  if (status === "received") return 1;
  return 0;
}

function getTrackingMeta(status: string, publicStatus?: string) {
  if (status === "waiting_member") return { label: publicStatus || "Aguardando você", badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200", iconClass: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" };
  if (["answered", "closed", "archived"].includes(status)) return { label: publicStatus || "Concluído", badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200", iconClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" };
  if (["assigned", "in_progress"].includes(status)) return { label: publicStatus || "Em acompanhamento", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200", iconClass: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200" };
  return { label: publicStatus || "Recebido", badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200", iconClass: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200" };
}

function getTrackingIcon(formType: string): LucideIcon {
  if (formType === "volunteer") return Users;
  if (formType === "pastor_care") return HeartHandshake;
  return ShieldCheck;
}

function getFormTypeLabel(formType: string) {
  const labels: Record<string, string> = { prayer: "Oração", volunteer: "Voluntariado", visitor: "Visitante", pastor_care: "Cuidado pastoral", group: "Grupos", custom: "Formulário" };
  return labels[formType] ?? "Pedido";
}

function getDefaultNextAction(status: string) {
  if (status === "waiting_member") return "Confira o retorno da igreja e responda pelos canais informados.";
  if (["answered", "closed", "archived"].includes(status)) return "Nenhuma ação pendente no momento.";
  if (["assigned", "in_progress"].includes(status)) return "Aguarde o próximo retorno da equipe responsável.";
  return "A igreja fará a primeira análise do seu pedido.";
}

function formatTrackingDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "data não informada" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function getSubmissionTitle(formType: string) {
  const labels: Record<string, string> = {
    prayer: "Pedido de oracao",
    volunteer: "Interesse em voluntariado",
    visitor: "Contato de visitante",
    pastor_care: "Cuidado pastoral",
    group: "Entrada em grupo",
    custom: "Formulario da igreja",
  };
  return labels[formType] ?? "Acompanhamento da igreja";
}

function getPublicStatus(status: string, publicStatus?: string) {
  if (publicStatus) return publicStatus;
  const labels: Record<string, string> = {
    received: "Recebido",
    assigned: "Encaminhado",
    in_progress: "Em acompanhamento",
    waiting_member: "Aguardando voce",
    answered: "Respondido",
    closed: "Encerrado",
    archived: "Arquivado",
  };
  return labels[status] ?? "Atualizado";
}
