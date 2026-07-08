"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Lock,
  MessageSquareHeart,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  type ChurchInboxItemPreview,
  type ChurchInboxStatus,
} from "../../services/churchManagementPreviewService";
import { churchManagementService } from "../../services/churchManagementService";
import { useAuth } from "../../contexts/AuthContext";
import type { ChurchFormSubmission, ChurchSubmissionPriority, ChurchSubmissionStatus } from "../../types";
import { getInboxAssignmentUpdate, getInboxStatusToggleUpdate } from "../../utils/churchManagementRules";

const statusFilters: Array<ChurchInboxStatus | "Todos"> = [
  "Todos",
  "Recebido",
  "Atribuido",
  "Em acompanhamento",
  "Aguardando membro",
  "Encerrado",
];

const priorityClass: Record<ChurchInboxItemPreview["priority"], string> = {
  Normal: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  Alta: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Urgente: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
};

const cardMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

type DisplayInboxItem = ChurchInboxItemPreview & {
  realId?: string;
  realStatus?: ChurchSubmissionStatus;
};

export default function ChurchInboxPreview() {
  const { currentUser, userProfile } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<(typeof statusFilters)[number]>("Todos");
  const [selectedId, setSelectedId] = useState("");
  const [submissions, setSubmissions] = useState<ChurchFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<ChurchInboxItemPreview["priority"] | "Todas">("Todas");
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [priorityDraft, setPriorityDraft] = useState<ChurchSubmissionPriority>("normal");
  const reduceMotion = useReducedMotion();
  const activeChurchId = userProfile?.churchData?.churchId;
  const currentUserId = currentUser?.id ?? currentUser?.uid ?? "";

  useEffect(() => {
    if (!activeChurchId) return;
    let isMounted = true;
    setIsLoading(true);
    churchManagementService.listSubmissions(activeChurchId, { limit: 50 })
      .then((items) => {
        if (!isMounted) return;
        setSubmissions(items);
        if (items[0]?.id) setSelectedId(items[0].id);
      })
      .catch(() => {
        if (isMounted) setSubmissions([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeChurchId]);

  const displayItems: DisplayInboxItem[] = useMemo(() => {
    return submissions.map(mapSubmissionToDisplay);
  }, [submissions]);

  const filteredItems = useMemo(
    () =>
      displayItems.filter((item) =>
        (selectedStatus === "Todos" || item.status === selectedStatus) &&
        (priorityFilter === "Todas" || item.priority === priorityFilter)
      ),
    [displayItems, priorityFilter, selectedStatus]
  );

  const selectedItem =
    filteredItems.find((item) => item.id === selectedId) ??
    filteredItems[0] ??
    displayItems[0];

  useEffect(() => {
    const selectedSubmission = submissions.find((submission) => submission.id === selectedItem?.realId);
    setAssigneeDraft(selectedSubmission?.assignedTo ?? "");
    setPriorityDraft(selectedSubmission?.priority ?? "normal");
  }, [selectedItem?.realId, submissions]);

  const updateSelectedStatus = async () => {
    if (!selectedItem?.realId) {
      setActionFeedback("Preview atualizado visualmente. Com dados reais, esta acao grava status e notifica o membro.");
      return;
    }
    try {
      const realStatus = selectedItem.realStatus ?? "received";
      const updated = await churchManagementService.updateSubmissionStatus(selectedItem.realId, getInboxStatusToggleUpdate(realStatus));
      setSubmissions((items) => items.map((item) => item.id === updated.id ? updated : item));
      setActionFeedback("Status atualizado e pronto para refletir em Minha Igreja.");
    } catch {
      setActionFeedback("Nao foi possivel atualizar agora. Verifique permissao/RLS para esta igreja.");
    }
  };

  const updateSelectedAssignment = async () => {
    if (!selectedItem?.realId) {
      setActionFeedback("Preview atualizado visualmente. Com dados reais, responsavel e prioridade ficam gravados na inbox.");
      return;
    }

    try {
      const realStatus = selectedItem.realStatus ?? "received";
      const updated = await churchManagementService.updateSubmissionStatus(selectedItem.realId, getInboxAssignmentUpdate({
        currentStatus: realStatus,
        assigneeDraft,
        priority: priorityDraft,
        publicStatus: selectedItem.publicStatus,
      }));
      setSubmissions((items) => items.map((item) => item.id === updated.id ? updated : item));
      setActionFeedback("Responsavel/prioridade atualizados. O status publico foi preservado com retorno seguro.");
    } catch {
      setActionFeedback("Nao foi possivel atribuir agora. Verifique permissao/RLS para esta igreja.");
    }
  };

  const motionProps = reduceMotion
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: { visible: { transition: { staggerChildren: 0.05 } } },
      };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950 dark:bg-[#05070b] dark:text-white">
      <section className="border-b border-slate-200 bg-[#0f172a] text-white dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link href="/gestao-igreja" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-200">
                <MessageSquareHeart size={15} className="text-[#d8b15f]" />
                Inbox de submissoes
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                Pedidos, voluntariado e cuidado
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
                Fila operacional para tudo que chega por QR ou formulario, com status interno, retorno publico ao membro e privacidade pastoral.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {buildRealSummary(submissions).map((metric, metricIndex) => {
                const Icon = metric.icon;
                return (
                  <div key={`${metric.label}-${metricIndex}`} className="rounded-lg border border-white/15 bg-white/8 p-4">
                    <Icon size={17} className="mb-3 text-[#d8b15f]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{metric.label}</p>
                    <p className="mt-2 text-3xl font-black">{metric.value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">{metric.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          {isLoading ? (
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              Carregando Inbox da igreja...
            </div>
          ) : null}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`min-h-11 shrink-0 rounded-lg border px-4 text-xs font-black uppercase tracking-wider transition ${
                  selectedStatus === status
                    ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Prioridade</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as ChurchInboxItemPreview["priority"] | "Todas")} className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-[#151b27] dark:text-white">
                {["Todas", "Normal", "Alta", "Urgente"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
          </div>

          <motion.div {...motionProps} className="grid gap-4">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id === selectedItem?.id;
              return (
                <motion.button
                  key={item.id}
                  variants={cardMotion}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white/[0.04] ${
                    isSelected
                      ? "border-[#d8b15f] ring-2 ring-[#d8b15f]/20 dark:border-[#f4d789]"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                        <Icon size={21} />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black">{item.title}</h2>
                          <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${priorityClass[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.summary}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <span className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {item.status}
                      </span>
                      <span className="rounded-lg bg-emerald-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
                        {item.publicStatus}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {!isLoading && filteredItems.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <h2 className="text-xl font-black">Nenhuma submissao real encontrada</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Os pedidos aparecem aqui quando alguem envia um QR/formulario ativo da igreja.
                </p>
                <Link href="/gestao-igreja/qrcodes/novo" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                  Criar QR
                  <ChevronRight size={16} />
                </Link>
              </div>
            ) : null}
          </motion.div>
        </div>

        <aside className="space-y-4">
          {!selectedItem ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <h2 className="text-2xl font-black">Inbox pronta</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Assim que um formulario publico for enviado, o detalhe protegido e as acoes de atribuicao aparecem aqui.
              </p>
            </section>
          ) : null}
          {selectedItem ? (
          <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Detalhe protegido</p>
                <h2 className="mt-1 text-2xl font-black">{selectedItem.title}</h2>
              </div>
              <Lock size={22} className="text-[#9a7a2f]" />
            </div>
            <dl className="grid gap-3 text-sm leading-7">
              {[
                ["Origem", selectedItem.source],
                ["Enviado por", selectedItem.submittedBy],
                ["Recebido", selectedItem.submittedAt],
                ["Responsavel", selectedItem.assignee],
                ["Ultima atualizacao", selectedItem.lastUpdate],
                ["Proxima acao", selectedItem.nextAction],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Link href={`/gestao-igreja/inbox/${selectedItem.realId ?? selectedItem.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                <ChevronRight size={16} />
                Ver detalhe
              </Link>
              <button type="button" onClick={updateSelectedAssignment} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                <UserCheck size={16} />
                Atribuir
              </button>
              <button type="button" onClick={updateSelectedStatus} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                <CheckCircle2 size={16} />
                Atualizar status
              </button>
            </div>
            {actionFeedback ? (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                {actionFeedback}
              </p>
            ) : null}
          </section>
          </>
          ) : null}
          {selectedItem ? (
          <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <UserCheck size={22} className="text-slate-700 dark:text-slate-200" />
              <h2 className="text-xl font-black">Responsavel e prioridade</h2>
            </div>
            <div className="grid gap-3">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">ID do responsavel</span>
                <input
                  value={assigneeDraft}
                  onChange={(event) => setAssigneeDraft(event.target.value)}
                  placeholder="UUID do pastor, lider ou gestor"
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-[#151b27] dark:text-white"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Prioridade</span>
                <select
                  value={priorityDraft}
                  onChange={(event) => setPriorityDraft(event.target.value as ChurchSubmissionPriority)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#d8b15f] focus:ring-2 focus:ring-[#d8b15f]/20 dark:border-white/10 dark:bg-[#151b27] dark:text-white"
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  type="button"
                  onClick={() => setAssigneeDraft(currentUserId)}
                  disabled={!currentUserId}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Atribuir a mim
                </button>
                <button
                  type="button"
                  onClick={updateSelectedAssignment}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  Salvar atribuicao
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-300" />
              <h2 className="text-xl font-black">Retorno e privacidade</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p><strong className="text-slate-900 dark:text-white">Status para o membro:</strong> {selectedItem.publicStatus}</p>
              <p><strong className="text-slate-900 dark:text-white">Privacidade:</strong> {selectedItem.privacy}</p>
              <p className="flex gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
                <Bell size={18} className="mt-1 shrink-0 text-[#9a7a2f]" />
                Alteracoes relevantes devem gerar notificacao para responsavel e feedback seguro para o usuario.
              </p>
            </div>
            <Link href="/minha-igreja/acompanhamento" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
              Ver espelho do membro
              <ChevronRight size={16} />
            </Link>
          </section>
          </>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function mapSubmissionToDisplay(submission: ChurchFormSubmission): DisplayInboxItem {
  return {
    id: submission.id,
    realId: submission.id,
    realStatus: submission.status,
    title: getSubmissionTitle(submission.formType),
    source: `Formulario ${submission.formType}`,
    type: normalizeDisplayType(submission.formType),
    status: mapSubmissionStatus(submission.status),
    publicStatus: submission.publicStatus,
    priority: mapPriority(submission.priority),
    assignee: submission.assignedTo ? "Responsavel atribuido" : "Sem responsavel",
    submittedBy: submission.submitterName || submission.submitterContact || (submission.submitterUserId ? "Membro identificado" : "Envio publico"),
    submittedAt: new Date(submission.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    lastUpdate: new Date(submission.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    privacy: submission.isSensitive ? "Restrito a cuidado pastoral autorizado" : "Visivel para responsaveis autorizados",
    summary: submission.internalSummary || submission.publicFeedback || "Submissao recebida pela igreja.",
    nextAction: submission.nextAction || "Definir proxima acao",
    icon: MessageSquareHeart,
  };
}

function mapSubmissionStatus(status: ChurchSubmissionStatus): ChurchInboxStatus {
  const map: Record<ChurchSubmissionStatus, ChurchInboxStatus> = {
    received: "Recebido",
    assigned: "Atribuido",
    in_progress: "Em acompanhamento",
    waiting_member: "Aguardando membro",
    answered: "Em acompanhamento",
    closed: "Encerrado",
    archived: "Encerrado",
  };
  return map[status];
}

function mapPriority(priority: ChurchSubmissionPriority): ChurchInboxItemPreview["priority"] {
  if (priority === "urgent") return "Urgente";
  if (priority === "high") return "Alta";
  return "Normal";
}

function normalizeDisplayType(type: string): ChurchInboxItemPreview["type"] {
  if (type === "volunteer" || type === "visitor" || type === "pastor_care" || type === "group") return type;
  return "prayer";
}

function getSubmissionTitle(type: string) {
  const titles: Record<string, string> = {
    prayer: "Pedido de oracao recebido",
    volunteer: "Interesse em voluntariado",
    visitor: "Visitante recebido",
    pastor_care: "Solicitacao de conversa pastoral",
    group: "Interesse em grupo",
  };
  return titles[type] ?? "Submissao recebida";
}

function buildRealSummary(submissions: ChurchFormSubmission[]) {
  return [
    { label: "Recebidos", value: String(submissions.length), detail: "No periodo carregado", icon: Bell },
    { label: "Alta prioridade", value: String(submissions.filter((item) => item.priority === "high" || item.priority === "urgent").length), detail: "Precisam atencao", icon: ShieldCheck },
    { label: "Aguardando membro", value: String(submissions.filter((item) => item.status === "waiting_member").length), detail: "Retorno enviado", icon: UserCheck },
    { label: "Sem responsavel", value: String(submissions.filter((item) => !item.assignedTo).length), detail: "Atribuicao pendente", icon: Lock },
  ];
}
