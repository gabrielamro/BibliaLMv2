"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Medal,
  ShieldCheck,
  Users,
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

  useEffect(() => {
    if (!activeChurchId || !currentUserId) return;
    let isMounted = true;
    setIsLoading(true);
    const request = section === "insignias"
      ? churchManagementService.listBadges(activeChurchId, { userId: currentUserId, limit: 25 }).then((items) => {
          if (isMounted) setBadges(items);
        })
      : churchManagementService.listSubmissions(activeChurchId, { submitterUserId: currentUserId, limit: 25 }).then((items) => {
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
  }, [activeChurchId, currentUserId, section]);

  const displayItems = useMemo(() => {
    if (isBadges && badges.length > 0) {
      return badges.map((badge) => ({
        key: badge.id,
        title: badge.title,
        detail: badge.description || "Conquista padrao do BibliaLM registrada por evento auditavel.",
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
              <p className="flex gap-3"><Medal size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />Insignias sao conquistas padrao do BibliaLM e nao medem maturidade espiritual.</p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
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
